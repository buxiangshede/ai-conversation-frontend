import { FormEvent, useEffect, useState } from 'react';
import { fetchWorkerHealth, generateAIResponse } from './api/client';
import type { HealthStatus, ServiceStatus } from './api/types';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  finishReason?: string | null;
};

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content: '嗨，我是你的 AI 助手，输入任何问题就可以开始对话了。'
  }
];

function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatusAndHealth = async () => {
      try {
        const { status: serviceStatus, health } = await fetchWorkerHealth();
        setStatus(serviceStatus);
        setHealthStatus(health);
        setHealthError(null);
      } catch (err) {
        console.error(err);
        setStatus({
          message: '服务状态未知，请稍后再试。',
          model: undefined
        });
        setHealthError('健康检查失败，请稍后再试。');
      }
    };

    fetchStatusAndHealth();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await generateAIResponse(userMessage.content);
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        model: data.model,
        finishReason: data.finishReason
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError('调用 AI 接口失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  const healthTimestamp = healthStatus ? new Date(healthStatus.timestamp).toLocaleString() : null;

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <p className="hero-kicker">Neural Interface</p>
          <h1>AI Conversation Console</h1>
          <p className="hero-subtitle">与自定义 AI Worker 实时沟通，体验带有量子流光的未来对话面板。</p>
        </div>
        <div className="hero-status">
          <div className="status-chip">
            <span className="status-label">Cloudflare Worker</span>
            <strong>{status ? status.message : '正在连接...'}</strong>
            <small>模型：{status?.model ?? '未配置'}</small>
          </div>
          <div className="status-chip">
            <span className="status-label">系统健康</span>
            <strong>{healthStatus ? healthStatus.status : healthError ?? '检查中...'}</strong>
            <small>{healthTimestamp ? `更新于 ${healthTimestamp}` : '等待最新信号'}</small>
          </div>
        </div>
      </header>

      <main className="chat-deck">
        <section className="message-surface" aria-live="polite">
          <div className="message-stream">
            {messages.map((message, idx) => (
              <article key={idx} className={`message-card ${message.role}`}>
                <div className="message-meta">
                  <span>{message.role === 'user' ? '来 自 你' : '来自 AI Core'}</span>
                  {message.model && (
                    <span className="message-model">
                      {message.model}
                      {message.finishReason ? ` · ${message.finishReason}` : ''}
                    </span>
                  )}
                </div>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
          {error && <p className="error-banner">{error}</p>}
        </section>

        <section className="composer-panel">
          <form onSubmit={handleSubmit}>
            <textarea
              name="prompt"
              placeholder="输入你的问题，Shift + Enter 换行..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />
            <div className="composer-actions">
              <span className="hint-dot">实时直连 · 无中间层</span>
              <button type="submit" disabled={loading}>
                {loading ? '生成中...' : '发送指令'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
