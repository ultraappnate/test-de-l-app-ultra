import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function Chat() {
  const { recipientId } = useParams()
  const { messages, fetchMessages, sendMessage, user } = useStore()
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (recipientId) {
      fetchMessages(recipientId)
      const interval = setInterval(() => fetchMessages(recipientId), 3000)
      return () => clearInterval(interval)
    }
  }, [recipientId])

  const handleSend = async (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      await sendMessage(recipientId, newMessage)
      setNewMessage('')
      await fetchMessages(recipientId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-2xl mx-auto flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-bordeaux text-white p-4 font-semibold">Chat</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.senderId === user?.id ? 'bg-bordeaux text-white' : 'bg-gray-200 text-gray-800'
              }`}>
                {msg.message}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écris un message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-bordeaux"
          />
          <button type="submit" className="bg-bordeaux text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
