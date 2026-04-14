'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAdminChat } from '@/contexts/AdminChatContext';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type AdminChatProps = {
  currentPage: string;
};

function getAuthHeaders(): Record<string, string> {
  const pw = typeof window !== 'undefined' ? localStorage.getItem('admin-password') : '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (pw) headers['x-admin-password'] = pw;
  return headers;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

export default function AdminChat({ currentPage }: AdminChatProps) {
  const { screenData } = useAdminChat();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Build full context combining API data + screen data
  const buildFullContext = useCallback((): string | undefined => {
    if (!context) return undefined;

    const contextParts = [context];

    // Add screen data if available
    if (screenData) {
      const sd = screenData;
      let screenPart = `\n\n=== DỮ LIỆU ĐANG HIỂN THỊ TRÊN MÀN HÌNH ===\n`;
      screenPart += `📄 Trang: ${sd.title}\n`;

      if (sd.filters && sd.filters.length > 0) {
        screenPart += `🔍 Filter hiện tại: ${sd.filters.join(' | ')}\n`;
      }

      if (sd.stats && Object.keys(sd.stats).length > 0) {
        screenPart += `📊 Thống kê:\n`;
        for (const [key, val] of Object.entries(sd.stats)) {
          screenPart += `   - ${key}: ${typeof val === 'number' ? formatMoney(val) : val}\n`;
        }
      }

      if (sd.items && sd.items.length > 0) {
        screenPart += `📋 Đang hiển thị ${sd.items.length} mục:\n`;
        const displayItems = sd.items.slice(0, 15);
        for (const item of displayItems) {
          screenPart += `   • ${item}\n`;
        }
        if (sd.items.length > 15) {
          screenPart += `   ... và ${sd.items.length - 15} mục khác\n`;
        }
      }

      screenPart += sd.summary ? `\n📝 Tóm tắt: ${sd.summary}\n` : '';
      contextParts.push(screenPart);
    }

    return contextParts.join('');
  }, [context, screenData]);

  const fetchContext = useCallback(async () => {
    setContextLoading(true);
    try {
      const res = await fetch(`/api/admin-chat/context?page=${currentPage}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setContext(json.data.context);
      } else {
        console.error('Failed to fetch context:', json.error);
      }
    } catch (e) {
      console.error('Failed to fetch context:', e);
    } finally {
      setContextLoading(false);
    }
  }, [currentPage]);

  const handleOpen = () => {
    setIsOpen(true);
    fetchContext();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Create placeholder for assistant response (will be updated via stream)
    const assistantIndex = newMessages.length;
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    // Track if we received fetching_data signal
    let isFetchingData = false;

    try {
      const fullContext = buildFullContext();

      const allMessages = [
        {
          role: 'system',
          content: `Bạn là trợ lý AI cho shop thời trang nữ "TRANG ANH STORE".
Trả lời bằng tiếng Việt, trả lời đúng con số trong DATABASE.
Bạn có quyền truy cập dữ liệu từ database và dữ liệu đang hiển thị trên màn hình admin.
Khi người dùng hỏi về số liệu, ưu tiên dùng dữ liệu đang hiển thị trên màn hình (nếu có).
Nếu người dùng hỏi "tại sao", "làm thế nào", hãy đưa ra phân tích chi tiết.
Nếu có dữ liệu tươi được cung cấp trong context, hãy sử dụng dữ liệu đó để trả lời chính xác nhất.`,
        },
        ...newMessages,
      ];

      const res = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ messages: allMessages, context: fullContext }),
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
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6); // Không .trim() để giữ khoảng trắng
          if (data === '[DONE]') break;

          // Handle meta signal for auto-fetch
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

          // If we were fetching data, clear the loading message
          if (isFetchingData && !accumulatedContent) {
            accumulatedContent = '';
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setMessages(prev => {
                const updated = [...prev];
                updated[assistantIndex] = { role: 'assistant', content: `❌ Lỗi: ${parsed.error}` };
                return updated;
              });
              return;
            }
          } catch {
            // Not JSON — treat as raw text chunk
            const chunkData = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
            // QUAN TRỌNG: xử lý "\n" mà backend encode thành literal \n trong SSE
            if (chunkData === '\\n' || chunkData === '\n') {
              // Đây là newline mà AI gửi → thêm newline thực vào text
              accumulatedContent += '\n';
            } else if (chunkData !== '') {
              accumulatedContent += chunkData;
            } else {
              // Empty data line trong SSE = newline
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
      }

      // Final trim
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setContext(null);
    fetchContext();
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#1A0A04',
            color: '#EDE8DF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(26,10,4,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,10,4,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,10,4,0.3)';
          }}
          title="Chat với AI"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Panel Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 9998,
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '420px',
              maxWidth: '100vw',
              backgroundColor: '#fff',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 9999,
              animation: 'slideInRight 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #eee',
                backgroundColor: '#1A0A04',
                color: '#EDE8DF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                </svg>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Trợ lý AI</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: 400 }}>
                    {contextLoading ? 'Đang tải dữ liệu...' : context ? `Đang xem: ${screenData?.title || currentPage}` : 'Phân tích dữ liệu'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    title="Xóa lịch sử chat"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#EDE8DF',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                    }}
                  >
                    ↻ Mới
                  </button>
                )}
                <button
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#EDE8DF',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    marginTop: '3rem',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '1rem' }}>🤖</div>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                    Xin chào! Mình là trợ lý AI của TRANG ANH STORE.
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#777' }}>
                    Mình có thể giúp bạn phân tích:<br />
                    📊 Doanh thu, đơn hàng<br />
                    📦 Tồn kho sản phẩm<br />
                    👥 Khách hàng, nhân viên<br />
                    💡 Đề xuất kinh doanh
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '0.75rem 1rem',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: msg.role === 'user' ? '#1A0A04' : '#f5f0eb',
                      color: msg.role === 'user' ? '#EDE8DF' : '#1A0A04',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '16px 16px 16px 4px',
                      backgroundColor: '#f5f0eb',
                      fontSize: '14px',
                      color: '#999',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <span style={{ animation: 'pulse 1.4s infinite', animationDelay: '0s' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite', animationDelay: '0.2s' }}>●</span>
                    <span style={{ animation: 'pulse 1.4s infinite', animationDelay: '0.4s' }}>●</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid #eee',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                backgroundColor: '#fff',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi cho AI..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '24px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1A0A04')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: input.trim() && !isLoading ? '#1A0A04' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
