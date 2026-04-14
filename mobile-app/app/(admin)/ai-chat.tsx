import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/theme';
import { API_URL } from '@/src/utils/constants';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

function getAuthHeaders(): Record<string, string> {
  const state = useAuthStore.getState();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (state.role === 'admin' && state.adminPassword) {
    headers['x-admin-password'] = state.adminPassword;
  } else if (state.role === 'staff' && state.staffToken) {
    headers['staff-token'] = state.staffToken;
  }
  return headers;
}

export default function AIChatScreen() {
  const params = useLocalSearchParams<{ page?: string }>();
  const currentPage = params.page || 'dashboard';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [context, setContext] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Fetch context on mount
  useEffect(() => {
    fetchContext();
  }, []);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const fetchContext = async () => {
    setContextLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin-chat/context?page=${currentPage}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setContext(json.data.context);
      }
    } catch {
      // ignore
    } finally {
      setContextLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantIndex = newMessages.length;
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    let isFetchingData = false;

    try {
      const res = await fetch(`${API_URL}/api/admin-chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: newMessages, context }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex] = { role: 'assistant', content: `❌ Lỗi: ${errorText}` };
          return updated;
        });
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          if (data === '__META__:fetching_data') {
            isFetchingData = true;
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantIndex] = {
                role: 'assistant',
                content: '🔄 Đang lấy dữ liệu từ database...',
              };
              return updated;
            });
            continue;
          }

          if (isFetchingData && !accumulatedContent) {
            accumulatedContent = '';
          }

          // Handle newline encoding
          if (data === '\\n' || data === '\n') {
            accumulatedContent += '\n';
          } else if (data !== '') {
            accumulatedContent += data;
          } else {
            accumulatedContent += '\n';
          }

          setMessages(prev => {
            const updated = [...prev];
            updated[assistantIndex] = {
              role: 'assistant',
              content: accumulatedContent,
            };
            return updated;
          });
        }
      }

      // Final update
      if (accumulatedContent.trim()) {
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: 'assistant',
            content: accumulatedContent.trim(),
          };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantIndex] = {
          role: 'assistant',
          content: '❌ Lỗi kết nối. Vui lòng thử lại.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    fetchContext();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={20} color={colors.blush} />
          <View>
            <Text style={styles.headerTitle}>Trợ lý AI</Text>
            <Text style={styles.headerSubtitle}>
              {contextLoading ? 'Đang tải dữ liệu...' : context ? `Trang: ${currentPage}` : 'Sẵn sàng'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="refresh" size={18} color={colors.stone[400]} />
            <Text style={styles.clearText}>Mới</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeIcon}>🤖</Text>
            <Text style={styles.welcomeTitle}>Xin chào!</Text>
            <Text style={styles.welcomeText}>
              Mình là trợ lý AI của TRANG ANH STORE.{'\n'}
              Mình có thể giúp bạn phân tích:{'\n'}
              📊 Doanh thu, đơn hàng{'\n'}
              📦 Tồn kho sản phẩm{'\n'}
              👥 Khách hàng, nhân viên
            </Text>
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.role === 'user' ? styles.userText : styles.assistantText,
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingRow}>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.dots}>
                <Text style={styles.dot}>●</Text>
                <Text style={styles.dot}>●</Text>
                <Text style={styles.dot}>●</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu hỏi cho AI..."
          placeholderTextColor={colors.stone[400]}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color={colors.cream} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.stone[200],
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.espresso },
  headerSubtitle: { fontSize: 10, color: colors.stone[400] },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  clearText: { fontSize: 11, color: colors.stone[400], fontWeight: '600' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  welcome: { alignItems: 'center', paddingVertical: 48 },
  welcomeIcon: { fontSize: 48, marginBottom: 16 },
  welcomeTitle: { fontSize: 18, fontWeight: '600', color: colors.espresso, marginBottom: 8 },
  welcomeText: { fontSize: 14, color: colors.stone[500], textAlign: 'center', lineHeight: 22 },
  messageBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.espresso, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.stone[200] },
  messageText: { fontSize: 14, lineHeight: 22 },
  userText: { color: colors.cream },
  assistantText: { color: colors.espresso },
  loadingRow: { alignSelf: 'flex-start' },
  dots: { flexDirection: 'row', gap: 4, padding: 8 },
  dot: { fontSize: 16, color: colors.stone[300] },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.stone[200],
  },
  input: {
    flex: 1, backgroundColor: colors.cream, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.espresso,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.espresso,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.stone[300] },
});
