'use client';

import React, { useState } from 'react';
import { Users, ThumbsUp, Plus, DollarSign, Share2, Check, QrCode } from 'lucide-react';

interface AttractionVote {
  id: string;
  name: string;
  votes: number;
  voters: string[];
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
}

export default function GroupCollabPage() {
  const [roomCode] = useState('JAIPUR-2026-GROUP');
  const [currentUser, setCurrentUser] = useState('Arnab');
  const [copied, setCopied] = useState(false);

  // Attractions Voting State
  const [attractions, setAttractions] = useState<AttractionVote[]>([
    { id: '1', name: 'Amber Fort Sunrise Elephant View', votes: 3, voters: ['Arnab', 'Priya', 'Rohan'] },
    { id: '2', name: 'Nahargarh Sunset Cycling Tour', votes: 2, voters: ['Arnab', 'Rohan'] },
    { id: '3', name: 'Chokhi Dhani Traditional Dinner', votes: 4, voters: ['Arnab', 'Priya', 'Rohan', 'Sneha'] },
    { id: '4', name: 'City Palace Museum Walk', votes: 1, voters: ['Priya'] },
  ]);

  // Shared Expense Ledger State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'e1', title: 'Tempo Traveler / Cab Booking', amount: 4800, paidBy: 'Arnab' },
    { id: 'e2', title: 'Heritage Haveli Advance', amount: 6500, paidBy: 'Priya' },
    { id: 'e3', title: 'Evening Street Food Tour', amount: 1400, paidBy: 'Rohan' },
  ]);

  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  const handleVote = (id: string) => {
    setAttractions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const hasVoted = item.voters.includes(currentUser);
          return {
            ...item,
            votes: hasVoted ? item.votes - 1 : item.votes + 1,
            voters: hasVoted ? item.voters.filter((v) => v !== currentUser) : [...item.voters, currentUser],
          };
        }
        return item;
      })
    );
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle || !newExpAmount) return;
    setExpenses([
      ...expenses,
      {
        id: Date.now().toString(),
        title: newExpTitle,
        amount: parseFloat(newExpAmount),
        paidBy: currentUser,
      },
    ]);
    setNewExpTitle('');
    setNewExpAmount('');
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const perPersonSplit = (totalExpense / 4).toFixed(2);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container group-page">
      <div className="page-header">
        <div>
          <span className="badge badge-saffron">Realtime Travel Room</span>
          <h1>Group Trip Collaboration & Split Ledger</h1>
          <p>Vote on attractions together and automatically calculate split-bill balances.</p>
        </div>

        <div className="room-badge-box glass-panel">
          <div className="room-code-info">
            <span className="room-label">Live Room Code:</span>
            <strong>{roomCode}</strong>
          </div>
          <button onClick={copyRoomLink} className="btn btn-secondary btn-sm">
            {copied ? <Check size={14} className="text-emerald" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied!' : 'Share Room'}</span>
          </button>
        </div>
      </div>

      <div className="user-switch-bar glass-card">
        <span>Simulate As Co-Traveler:</span>
        <div className="user-chips">
          {['Arnab', 'Priya', 'Rohan', 'Sneha'].map((user) => (
            <button
              key={user}
              onClick={() => setCurrentUser(user)}
              className={`user-chip ${currentUser === user ? 'active' : ''}`}
            >
              👤 {user} {currentUser === user && '(You)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2 group-grid">
        {/* Attraction Voting Canvas */}
        <div className="glass-panel group-card">
          <div className="card-head">
            <ThumbsUp size={20} className="text-saffron" />
            <h3>Attraction Preference Voting</h3>
          </div>
          <p className="card-desc">Co-travelers cast votes on top itinerary spots to reach democratic consensus.</p>

          <div className="attraction-list">
            {attractions.map((item) => {
              const hasVoted = item.voters.includes(currentUser);
              return (
                <div key={item.id} className="vote-row">
                  <div className="vote-info">
                    <h4>{item.name}</h4>
                    <span className="voters-text">Voters: {item.voters.join(', ') || 'None yet'}</span>
                  </div>

                  <button
                    onClick={() => handleVote(item.id)}
                    className={`btn btn-sm ${hasVoted ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <ThumbsUp size={14} />
                    <span>{item.votes}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared Expense Ledger */}
        <div className="glass-panel group-card">
          <div className="card-head">
            <DollarSign size={20} className="text-emerald" />
            <h3>Shared Expense Ledger & UPI Split</h3>
          </div>
          <p className="card-desc">Transparent expense logging with instant 4-way per person split calculation.</p>

          <div className="ledger-summary">
            <div className="summary-item">
              <span className="sum-label">Total Trip Pool</span>
              <span className="sum-val">₹{totalExpense.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="sum-label">Split Per Person (4 Pax)</span>
              <span className="sum-val text-emerald">₹{perPersonSplit}</span>
            </div>
          </div>

          <div className="expense-list">
            {expenses.map((exp) => (
              <div key={exp.id} className="expense-row">
                <div>
                  <strong>{exp.title}</strong>
                  <span className="paid-by">Paid by {exp.paidBy}</span>
                </div>
                <span className="exp-amt">₹{exp.amount}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddExpense} className="add-expense-form">
            <input
              type="text"
              placeholder="Expense title (e.g. Lunch thali)"
              value={newExpTitle}
              onChange={(e) => setNewExpTitle(e.target.value)}
              className="form-input"
            />
            <input
              type="number"
              placeholder="₹ Amount"
              value={newExpAmount}
              onChange={(e) => setNewExpAmount(e.target.value)}
              className="form-input w-half"
            />
            <button type="submit" className="btn btn-emerald">
              <Plus size={16} /> Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
