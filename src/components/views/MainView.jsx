import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

const CmdIcon = () => (
    <svg width="14px" height="14px" viewBox="0 0 24 24" strokeWidth="2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9H18C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const EnterIcon = () => (
    <svg width="14px" height="14px" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.25 19.25L6.75 15.75L10.25 12.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 15.75H12.75C14.9591 15.75 16.75 13.9591 16.75 11.75V4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const MainView = forwardRef(function MainView({ onStart, onAPIKeyHelp, onLayoutModeChange }, ref) {
    const [isInitializing, setIsInitializing] = useState(false);
    const [showApiKeyError, setShowApiKeyError] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '');

    useImperativeHandle(ref, () => ({
        triggerApiKeyError: () => {
            setShowApiKeyError(true);
            setTimeout(() => setShowApiKeyError(false), 1000);
        }
    }));

    useEffect(() => {
        // Listen for session initializing events
        if (window.electron?.ipcRenderer) {
            const handler = (event, initializing) => {
                setIsInitializing(initializing);
            };
            window.electron.ipcRenderer.on('session-initializing', handler);
            return () => window.electron.ipcRenderer.removeAllListeners('session-initializing');
        }
    }, []);

    // Resize layout function
    const resizeLayout = useCallback(async () => {
        try {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                const result = await ipcRenderer.invoke('update-sizes');
                if (result && result.success) {
                    console.log('Window resized for current view');
                } else {
                    console.warn('Window resize returned:', result);
                }
            }
        } catch (error) {
            console.error('Error resizing window:', error);
        }
    }, []);

    useEffect(() => {
        // Load and apply layout mode on startup
        const savedLayoutMode = localStorage.getItem('layoutMode');
        if (savedLayoutMode && savedLayoutMode !== 'normal') {
            onLayoutModeChange?.(savedLayoutMode);
        }
        
        // Resize window for this view
        resizeLayout();
    }, [onLayoutModeChange, resizeLayout]);

    const handleStartClick = useCallback(() => {
        if (isInitializing) return;
        onStart();
    }, [isInitializing, onStart]);

    const handleKeydown = useCallback((e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isStartShortcut = isMac ? e.metaKey && e.key === 'Enter' : e.ctrlKey && e.key === 'Enter';

        if (isStartShortcut) {
            e.preventDefault();
            handleStartClick();
        }
    }, [handleStartClick]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, [handleKeydown]);

    const handleInput = (e) => {
        const value = e.target.value;
        setApiKey(value);
        localStorage.setItem('apiKey', value);
        if (showApiKeyError) {
            setShowApiKeyError(false);
        }
    };

    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <div className="main-view">
            <div className="welcome">
                <span className="text-gradient">Welcome to Cheating Daddy</span>
            </div>
            <p className="description" style={{ marginBottom: '32px', fontSize: '15px', lineHeight: '1.6' }}>
                Your AI-powered assistant for real-time conversations. Get intelligent responses during interviews, meetings, and more.
            </p>

            <div className="input-group">
                <input
                    type="password"
                    placeholder="Enter your Gemini API Key"
                    value={apiKey}
                    onChange={handleInput}
                    className={showApiKeyError ? 'api-key-error' : ''}
                    style={{ 
                        fontSize: '14px',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        border: showApiKeyError ? '1px solid var(--accent-error)' : '1px solid var(--border-primary)'
                    }}
                />
                <button 
                    onClick={handleStartClick} 
                    className={`start-button ${isInitializing ? 'initializing' : ''}`}
                    disabled={isInitializing}
                    style={{
                        padding: '14px 28px',
                        fontSize: '15px',
                        fontWeight: '600',
                        borderRadius: '10px',
                        minWidth: '140px',
                        justifyContent: 'center'
                    }}
                >
                    {isInitializing ? (
                        <>
                            <span style={{ 
                                display: 'inline-block',
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: 'white',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                marginRight: '8px'
                            }}></span>
                            Starting...
                        </>
                    ) : (
                        <>
                            Start Session
                            <span className="shortcut-icons">
                                {isMac ? <CmdIcon /> : 'Ctrl'}
                                <EnterIcon />
                            </span>
                        </>
                    )}
                </button>
            </div>
            <p className="description" style={{ marginTop: '8px', fontSize: '13px' }}>
                Don't have an API key?{' '}
                <span onClick={onAPIKeyHelp} className="link" style={{ fontWeight: '500' }}>Get one here</span>
            </p>
        </div>
    );
});



