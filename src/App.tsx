import { FormEvent, useEffect, useState } from 'react';
import { requestGraphQL } from './graphql/client';
import { GENERATE_MUTATION, STATUS_QUERY } from './graphql/queries';
import type { AIMessage, ServiceStatus } from './graphql/types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await requestGraphQL<{ status: ServiceStatus }>(STATUS_QUERY);
        setStatus(data.status);
      } catch (err) {
        console.error(err);
        setStatus({
          message: '服务状态未知，请稍后再试。',
          model: undefined
        });
      }
    };

    fetchStatus();
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
      const data = await requestGraphQL<{ generateResponse: AIMessage }>(GENERATE_MUTATION, {
        input: { message: userMessage.content }
      });
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.generateResponse.content,
        model: data.generateResponse.model,
        finishReason: data.generateResponse.finishReason
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

