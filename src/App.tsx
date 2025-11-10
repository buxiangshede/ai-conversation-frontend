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

  return (
    <div className="app-shell">
      <section className="card">
        <h1>AI Conversation</h1>
        <p className="status">
          {status ? `Cloudflare Worker: ${status.message}（模型：${status.model ?? '未配置'}）` : '正在检查服务状态...'}
        </p>
        <p className="status">
          {healthStatus
            ? `健康检查：${healthStatus.status}（更新于 ${new Date(healthStatus.timestamp).toLocaleString()}）`
            : (healthError ?? '正在进行健康检查...')}
        </p>
      </section>

      <section className="card messages" aria-live="polite">
        {messages.map((message, idx) => (
          <article key={idx} className={`message ${message.role}`}>
            <strong>{message.role === 'user' ? '你' : 'AI'}</strong>
            <div>{message.content}</div>
            {message.model && (
              <small>
                模型：{message.model}
                {message.finishReason ? ` · ${message.finishReason}` : ''}
              </small>
            )}
          </article>
        ))}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <form onSubmit={handleSubmit}>
          <textarea
            name="prompt"
            placeholder="输入你的问题..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? '生成中...' : '发送'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default App;
