import React, { useState, useEffect } from 'react';

const CloseIcon = () => (
    <svg width="16px" height="16px" strokeWidth="1.7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronLeft = () => (
    <svg width="16px" height="16px" strokeWidth="1.7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const profileNames = {
    interview: 'Job Interview',
    sales: 'Sales Call',
    meeting: 'Business Meeting',
    presentation: 'Presentation',
    negotiation: 'Negotiation',
    exam: 'Exam Assistant',
};

async function resizeLayout() {
    try {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('update-sizes');
        }
    } catch (error) {
        console.error('Error resizing window:', error);
    }
}

export function HistoryView() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sessions');
    const [savedResponses, setSavedResponses] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('savedResponses') || '[]');
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        resizeLayout();
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            setLoading(true);
            const allSessions = await window.cheddar?.getAllConversationSessions() || [];
            setSessions(allSessions);
        } catch (error) {
            console.error('Error loading conversation sessions:', error);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSessionPreview = (session) => {
        if (!session.conversationHistory || session.conversationHistory.length === 0) {
            return 'No conversation yet';
        }
        const firstTurn = session.conversationHistory[0];
        const preview = firstTurn.transcription || firstTurn.ai_response || 'Empty conversation';
        return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
    };

    const handleBackClick = () => {
        setSelectedSession(null);
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const deleteSavedResponse = (index) => {
        const newSavedResponses = savedResponses.filter((_, i) => i !== index);
        setSavedResponses(newSavedResponses);
        localStorage.setItem('savedResponses', JSON.stringify(newSavedResponses));
    };

    const renderSessionsList = () => {
        if (loading) {
            return <div className="loading">Loading conversation history...</div>;
        }

        if (sessions.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-title">No conversations yet</div>
                    <div>Start a session to see your conversation history here</div>
                </div>
            );
        }

        return (
            <div className="sessions-list">
                {sessions.map((session, index) => (
                    <div key={session.sessionId || index} className="session-item" onClick={() => handleSessionClick(session)}>
                        <div className="session-header">
                            <div className="session-date">{formatDate(session.timestamp)}</div>
                            <div className="session-time">{formatTime(session.timestamp)}</div>
                        </div>
                        <div className="session-preview">{getSessionPreview(session)}</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSavedResponses = () => {
        if (savedResponses.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-state-title">No saved responses</div>
                    <div>Use the save button during conversations to save important responses</div>
                </div>
            );
        }

        return (
            <div className="sessions-list">
                {savedResponses.map((saved, index) => (
                    <div key={index} className="saved-response-item">
                        <div className="saved-response-header">
                            <div>
                                <div className="saved-response-profile">{profileNames[saved.profile] || saved.profile}</div>
                                <div className="saved-response-date">{formatTimestamp(saved.timestamp)}</div>
                            </div>
                            <button className="delete-button" onClick={() => deleteSavedResponse(index)} title="Delete saved response">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="saved-response-content">{saved.response}</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderConversationView = () => {
        if (!selectedSession) return null;

        const { conversationHistory } = selectedSession;
        const messages = [];
        
        if (conversationHistory) {
            conversationHistory.forEach(turn => {
                if (turn.transcription) {
                    messages.push({
                        type: 'user',
                        content: turn.transcription,
                        timestamp: turn.timestamp,
                    });
                }
                if (turn.ai_response) {
                    messages.push({
                        type: 'ai',
                        content: turn.ai_response,
                        timestamp: turn.timestamp,
                    });
                }
            });
        }

        return (
            <>
                <div className="back-header">
                    <button className="back-button" onClick={handleBackClick}>
                        <ChevronLeft />
                        Back to Sessions
                    </button>
                    <div className="legend">
                        <div className="legend-item">
                            <div className="legend-dot user" />
                            <span>Them</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot ai" />
                            <span>Suggestion</span>
                        </div>
                    </div>
                </div>
                <div className="conversation-view">
                    {messages.length > 0
                        ? messages.map((message, index) => (
                            <div key={index} className={`message ${message.type}`}>{message.content}</div>
                        ))
                        : <div className="empty-state">No conversation data available</div>}
                </div>
            </>
        );
    };

    if (selectedSession) {
        return (
            <div className="history-view">
                <div className="history-container">
                    {renderConversationView()}
                </div>
            </div>
        );
    }

    return (
        <div className="history-view">
            <div className="history-container">
                <div className="tabs-container">
                    <button 
                        className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} 
                        onClick={() => handleTabClick('sessions')}
                    >
                        Conversation History
                    </button>
                    <button 
                        className={`tab ${activeTab === 'saved' ? 'active' : ''}`} 
                        onClick={() => handleTabClick('saved')}
                    >
                        Saved Responses ({savedResponses.length})
                    </button>
                </div>
                {activeTab === 'sessions' ? renderSessionsList() : renderSavedResponses()}
            </div>
        </div>
    );
}


