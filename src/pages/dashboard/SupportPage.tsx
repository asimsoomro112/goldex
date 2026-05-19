import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { MessageSquare, HelpCircle, Send, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { createSupportTicket, addTicketReply, useUserTickets, SupportTicket } from '@/lib/dashboardData';

export function SupportPage() {
  const { user } = useAuth();
  const { tickets, loading } = useUserTickets(user?.uid);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await createSupportTicket(user.uid, user.displayName || 'User', user.email || '', subject.trim(), message.trim());
      toast.success('Support ticket created successfully!');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Could not submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setReplySubmitting(true);
    try {
      await addTicketReply(selectedTicket.id, 'user', replyMessage.trim());
      toast.success('Reply submitted!');
      setReplyMessage('');
      const updatedReplies = [
        ...(selectedTicket.replies || []),
        { sender: 'user' as const, message: replyMessage.trim(), createdAt: new Date() }
      ];
      setSelectedTicket({
        ...selectedTicket,
        replies: updatedReplies,
        status: 'open'
      });
    } catch (error: any) {
      toast.error(error.message || 'Could not send reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-medium text-white">Live Support</h1>
          <p className="text-xs text-text-muted">Need help? Submit a ticket and our administrative team will reply shortly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Ticket Form */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 relative overflow-hidden flex flex-col">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-gold-500" />
              Create Support Ticket
            </h2>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Deposit Inquiry / Withdrawal Delay"
                  className="input-gold font-sans text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary uppercase tracking-wider mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="input-gold font-sans text-sm resize-none"
                />
              </div>
              <GoldButton type="submit" disabled={submitting} className="w-full h-12 text-sm mt-2">
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </GoldButton>
            </form>
          </GlassCard>
        </div>

        {/* Tickets History List */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <GlassCard className="p-0 overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-gold-500/10 flex justify-between items-center bg-dark-900/20">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold-500" />
                Your Support Tickets
              </h2>
            </div>
            
            {loading ? (
              <div className="p-12 text-center text-text-muted">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center gap-4">
                <HelpCircle className="w-12 h-12 text-gold-500/30" />
                <p className="text-sm">No support tickets submitted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gold-500/10 overflow-y-auto max-h-[500px]">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-6 hover:bg-dark-800/20 transition-colors flex items-start justify-between gap-4 ${selectedTicket?.id === ticket.id ? 'bg-gold-500/5' : ''}`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-profit-green'}`} />
                        <h4 className="text-sm font-medium text-white truncate">{ticket.subject}</h4>
                      </div>
                      <p className="text-xs text-text-muted truncate">{ticket.message}</p>
                      <span className="text-[10px] text-text-secondary block font-mono">
                        {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="badge badge-gold">
                        {ticket.status === 'open' ? 'Pending Reply' : 'Resolved'}
                      </span>
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span className="text-[10px] text-gold-500 font-medium">
                          {ticket.replies.length} replies
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Ticket Details / Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="gc max-w-2xl w-full bg-dark-950 border border-gold-500/20 rounded-3xl p-6 flex flex-col max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between pb-4 border-b border-gold-500/10">
              <div>
                <span className="badge badge-gold mb-2 inline-block">
                  {selectedTicket.status === 'open' ? 'Status: Open' : 'Status: Resolved'}
                </span>
                <h3 className="text-lg font-display font-medium text-white">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-text-muted hover:text-white transition-colors text-2xl font-mono p-2"
              >
                &times;
              </button>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2 min-h-[300px]">
              {/* Original Message */}
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="rounded-2xl rounded-tl-none bg-dark-900 border border-gold-500/10 p-4 text-sm text-white leading-relaxed">
                  <p className="text-xs text-gold-500 font-medium mb-1">{selectedTicket.name} (Original Inquiry)</p>
                  {selectedTicket.message}
                </div>
                <span className="text-[9px] text-text-muted mt-1 ml-1 font-mono">
                  {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'Just now'}
                </span>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map((reply, index) => {
                const isAdmin = reply.sender === 'admin';
                return (
                  <div key={index} className={`flex flex-col max-w-[85%] ${isAdmin ? 'ml-auto items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl p-4 text-sm leading-relaxed ${isAdmin ? 'rounded-tr-none bg-gold-500/10 border border-gold-500/20 text-white' : 'rounded-tl-none bg-dark-900 border border-gold-500/10 text-white'}`}>
                      <p className={`text-xs font-medium mb-1 ${isAdmin ? 'text-gold-500' : 'text-text-secondary'}`}>
                        {isAdmin ? '🛡️ GoldEx Support Team' : selectedTicket.name}
                      </p>
                      {reply.message}
                    </div>
                    <span className="text-[9px] text-text-muted mt-1 mr-1 font-mono">
                      {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : reply.createdAt?.toLocaleString ? reply.createdAt.toLocaleString() : 'Just now'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-gold-500/10 flex items-center gap-3">
              <input
                type="text"
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply message..."
                disabled={replySubmitting}
                className="flex-1 bg-dark-900 border border-gold-500/20 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={replySubmitting || !replyMessage.trim()}
                className="btn-gold h-11 px-4 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
