import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/theme';
import { API_URL } from '@/src/utils/constants';
import AdminDetailHeader from '@/src/components/admin/AdminDetailHeader';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function AIChatScreen() {
  const router = useRouter();
  const { role, adminPassword, staffToken } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (role === 'admin' && adminPassword) headers['x-admin-password'] = adminPassword;
    else if (role === 'staff' && staffToken) headers['staff-token'] = staffToken;
    return headers;
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

    try {
      const res = await fetch(`${API_URL}/api/admin-chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: newMessages }),
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
            accumulatedContent = '🔄 Đang lấy dữ liệu...\n';
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantIndex] = { role: 'assistant', content: accumulatedContent };
              return updated;
            });
            continue;
          }

          if (data === '\\n' || data === '\n') {
            accumulatedContent += '\n';
          } else if (data !== '') {
            accumulatedContent += data;
          }

          setMessages(prev => {
            const updated = [...prev];
            updated[assistantIndex] = { role: 'assistant', content: accumulatedContent };
            return updated;
          });
        }
      }

      if (accumulatedContent.trim()) {
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex] = { role: 'assistant', content: accumulatedContent.trim() };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantIndex] = { role: 'assistant', content: '❌ Lỗi kết nối. Vui lòng thử lại.' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(admin)/dashboard');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <AdminDetailHeader title="Trợ lý AI" onBack={handleBack} />

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <View style={styles.welcomeAvatar}>
              <Ionicons name="sparkles" size={40} color={colors.blush} />
            </View>
            <Text style={styles.welcomeTitle}>Xin chào! 👋</Text>
            <Text style={styles.welcomeText}>
              Mình là trợ lý AI của TRANG ANH STORE.{'\n\n'}
              📊 Phân tích doanh thu, đơn hàng{'\n'}
              📦 Kiểm tra tồn kho sản phẩm{'\n'}
              👥 Thống kê khách hàng, nhân viên
            </Text>
            <View style={styles.suggestions}>
              <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('Doanh thu hôm nay bao nhiêu?')}>
                <Text style={styles.suggestionText}>💰 Doanh thu hôm nay?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('Có bao nhiêu đơn hàng mới?')}>
                <Text style={styles.suggestionText}>📦 Đơn hàng mới?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionChip} onPress={() => setInput('Sản phẩm nào bán chạy nhất?')}>
                <Text style={styles.suggestionText}>🔥 SP bán chạy nhất?</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {messages.map((msg, i) => (
          <View key={i} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            {msg.role === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={14} color={colors.blush} />
              </View>
            )}
            <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.assistantText]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingRow}>
            <View style={styles.assistantAvatar}>
              <Ionicons name="sparkles" size={14} color={colors.blush} />
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.dots}>
                <View style={[styles.dot, styles.dotAnim1]} />
                <View style={[styles.dot, styles.dotAnim2]} />
                <View style={[styles.dot, styles.dotAnim3]} />
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
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={18} color={colors.cream} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  welcome: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  welcomeAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${colors.blush}20`,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: colors.espresso, marginBottom: 8 },
  welcomeText: { fontSize: 14, color: colors.stone[500], textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  suggestions: { width: '100%', gap: 8 },
  suggestionChip: {
    backgroundColor: colors.white, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.stone[200],
  },
  suggestionText: { fontSize: 13, color: colors.espresso, fontWeight: '500' },
  messageBubble: {
    maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  assistantAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: `${colors.blush}20`,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.espresso, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.stone[200] },
  messageText: { fontSize: 14, lineHeight: 22, flex: 1 },
  userText: { color: colors.cream },
  assistantText: { color: colors.espresso },
  loadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, alignSelf: 'flex-start' },
  dots: { flexDirection: 'row', gap: 4, padding: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.stone[300] },
  dotAnim1: { opacity: 1 },
  dotAnim2: { opacity: 0.5 },
  dotAnim3: { opacity: 0.2 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.stone[200],
  },
  input: {
    flex: 1, backgroundColor: colors.cream, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.espresso,
    maxHeight: 100, minHeight: 40,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.espresso,
    justifyContent: 'center', alignItems: 'center', marginBottom: 0,
  },
  sendBtnDisabled: { backgroundColor: colors.stone[300] },
});
