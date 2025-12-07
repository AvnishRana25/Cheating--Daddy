import React, { useState, useEffect, useRef, useCallback } from 'react';

const ChevronLeft = () => (
    <svg width="24px" height="24px" strokeWidth="1.7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#ffffff">
        <path d="M15 6L9 12L15 18" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronRight = () => (
    <svg width="24px" height="24px" strokeWidth="1.7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#ffffff">
        <path d="M9 6L15 12L9 18" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SaveIcon = () => (
    <svg width="24px" height="24px" strokeWidth="1.7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 20V5C5 3.89543 5.89543 3 7 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L19.4142 5.41421C19.7893 5.78929 20 6.29799 20 6.82843V20C20 21.1046 19.1046 22 18 22H7C5.89543 22 5 21 5 20Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 22V13H9V22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 3V8H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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

export function AssistantView({
    responses,
    currentResponseIndex,
    selectedProfile,
    onSendText,
    shouldAnimateResponse,
    onResponseIndexChanged,
    onResponseAnimationComplete
}) {
    const [savedResponses, setSavedResponses] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('savedResponses') || '[]');
        } catch (e) {
            return [];
        }
    });
    const [textInput, setTextInput] = useState('');
    const containerRef = useRef(null);
    const lastAnimatedWordCountRef = useRef(0);

    const getCurrentResponse = useCallback(() => {
        return responses.length > 0 && currentResponseIndex >= 0
            ? responses[currentResponseIndex]
            : `Hey, Im listening to your ${profileNames[selectedProfile] || 'session'}?`;
    }, [responses, currentResponseIndex, selectedProfile]);

    const wrapWordsInSpans = (htmlContent) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const tagsToSkip = ['PRE'];

        function wrap(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !tagsToSkip.includes(node.parentNode.tagName)) {
                const words = node.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                words.forEach(word => {
                    if (word.trim()) {
                        const span = document.createElement('span');
                        span.setAttribute('data-word', '');
                        span.textContent = word;
                        frag.appendChild(span);
                    } else {
                        frag.appendChild(document.createTextNode(word));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && !tagsToSkip.includes(node.tagName)) {
                Array.from(node.childNodes).forEach(wrap);
            }
        }
        Array.from(doc.body.childNodes).forEach(wrap);
        return doc.body.innerHTML;
    };

    const renderMarkdown = (content) => {
        if (typeof window !== 'undefined' && window.marked) {
            try {
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false,
                });
                let rendered = window.marked.parse(content);
                rendered = wrapWordsInSpans(rendered);
                return rendered;
            } catch (error) {
                console.warn('Error parsing markdown:', error);
                return content;
            }
        }
        return content;
    };

    useEffect(() => {
        // Load font size
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize !== null) {
            const fontSizeValue = parseInt(fontSize, 10) || 20;
            document.documentElement.style.setProperty('--response-font-size', `${fontSizeValue}px`);
            document.documentElement.style.setProperty('--text-lg', `${fontSizeValue}px`);
        }
    }, []);

    useEffect(() => {
        // Reset animation count when response index changes
        lastAnimatedWordCountRef.current = 0;
    }, [currentResponseIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const currentResponse = getCurrentResponse();
        const renderedResponse = renderMarkdown(currentResponse);
        container.innerHTML = renderedResponse;

        // Apply syntax highlighting if available
        if (window.hljs) {
            container.querySelectorAll('pre code').forEach((block) => {
                window.hljs.highlightElement(block);
            });
        }

        const words = container.querySelectorAll('[data-word]');
        if (shouldAnimateResponse) {
            for (let i = 0; i < lastAnimatedWordCountRef.current && i < words.length; i++) {
                words[i].classList.add('visible');
            }
            for (let i = lastAnimatedWordCountRef.current; i < words.length; i++) {
                words[i].classList.remove('visible');
                setTimeout(() => {
                    words[i].classList.add('visible');
                    if (i === words.length - 1) {
                        onResponseAnimationComplete?.();
                    }
                }, (i - lastAnimatedWordCountRef.current) * 100);
            }
            lastAnimatedWordCountRef.current = words.length;
        } else {
            words.forEach(word => word.classList.add('visible'));
            lastAnimatedWordCountRef.current = words.length;
        }
    }, [responses, currentResponseIndex, shouldAnimateResponse, getCurrentResponse, onResponseAnimationComplete]);

    useEffect(() => {
        // Set up IPC listeners for keyboard shortcuts
        if (window.require) {
            const { ipcRenderer } = window.require('electron');

            const handlePrevious = () => navigateToPreviousResponse();
            const handleNext = () => navigateToNextResponse();
            const handleScrollUp = () => scrollResponseUp();
            const handleScrollDown = () => scrollResponseDown();

            ipcRenderer.on('navigate-previous-response', handlePrevious);
            ipcRenderer.on('navigate-next-response', handleNext);
            ipcRenderer.on('scroll-response-up', handleScrollUp);
            ipcRenderer.on('scroll-response-down', handleScrollDown);

            return () => {
                ipcRenderer.removeListener('navigate-previous-response', handlePrevious);
                ipcRenderer.removeListener('navigate-next-response', handleNext);
                ipcRenderer.removeListener('scroll-response-up', handleScrollUp);
                ipcRenderer.removeListener('scroll-response-down', handleScrollDown);
            };
        }
    }, [currentResponseIndex, responses.length]);

    const navigateToPreviousResponse = () => {
        if (currentResponseIndex > 0) {
            onResponseIndexChanged(currentResponseIndex - 1);
        }
    };

    const navigateToNextResponse = () => {
        if (currentResponseIndex < responses.length - 1) {
            onResponseIndexChanged(currentResponseIndex + 1);
        }
    };

    const scrollResponseUp = () => {
        const container = containerRef.current;
        if (container) {
            const scrollAmount = container.clientHeight * 0.3;
            container.scrollTop = Math.max(0, container.scrollTop - scrollAmount);
        }
    };

    const scrollResponseDown = () => {
        const container = containerRef.current;
        if (container) {
            const scrollAmount = container.clientHeight * 0.3;
            container.scrollTop = Math.min(
                container.scrollHeight - container.clientHeight,
                container.scrollTop + scrollAmount
            );
        }
    };

    const handleSendText = async () => {
        if (textInput.trim()) {
            const message = textInput.trim();
            setTextInput('');
            await onSendText(message);
        }
    };

    const handleTextKeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    const saveCurrentResponse = () => {
        const currentResponse = getCurrentResponse();
        if (currentResponse && !isResponseSaved()) {
            const newSavedResponses = [
                ...savedResponses,
                {
                    response: currentResponse,
                    timestamp: new Date().toISOString(),
                    profile: selectedProfile,
                },
            ];
            setSavedResponses(newSavedResponses);
            localStorage.setItem('savedResponses', JSON.stringify(newSavedResponses));
        }
    };

    const isResponseSaved = () => {
        const currentResponse = getCurrentResponse();
        return savedResponses.some(saved => saved.response === currentResponse);
    };

    const responseCounter = responses.length > 0 ? `${currentResponseIndex + 1}/${responses.length}` : '';
    const isSaved = isResponseSaved();

    return (
        <div className="assistant-view">
            <div className="response-container" id="responseContainer" ref={containerRef} />

            <div className="text-input-container">
                <button 
                    className="nav-button" 
                    onClick={navigateToPreviousResponse} 
                    disabled={currentResponseIndex <= 0}
                    title="Previous response"
                >
                    <ChevronLeft />
                </button>

                {responses.length > 0 && (
                    <span className="response-counter">{responseCounter}</span>
                )}

                <button
                    className={`save-button ${isSaved ? 'saved' : ''}`}
                    onClick={saveCurrentResponse}
                    title={isSaved ? 'Response saved' : 'Save this response'}
                >
                    <SaveIcon />
                </button>

                <input
                    type="text"
                    id="textInput"
                    placeholder="Type a message to the AI..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleTextKeydown}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-glass)',
                        color: 'var(--text-primary)',
                        backdropFilter: 'blur(10px)'
                    }}
                />

                <button
                    onClick={handleSendText}
                    disabled={!textInput.trim()}
                    style={{
                        padding: '12px 20px',
                        background: textInput.trim() 
                            ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                            : 'var(--bg-glass)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: textInput.trim() ? 'pointer' : 'not-allowed',
                        opacity: textInput.trim() ? 1 : 0.5,
                        transition: 'all 0.2s ease',
                        boxShadow: textInput.trim() ? 'var(--shadow-md)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (textInput.trim()) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = 'var(--shadow-lg)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (textInput.trim()) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'var(--shadow-md)';
                        }
                    }}
                >
                    Send
                </button>

                <button 
                    className="nav-button" 
                    onClick={navigateToNextResponse} 
                    disabled={currentResponseIndex >= responses.length - 1}
                    title="Next response"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
}


