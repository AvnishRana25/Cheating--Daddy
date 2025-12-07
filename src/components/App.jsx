import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AppHeader } from './AppHeader.jsx';
import { MainView } from './views/MainView.jsx';
import { CustomizeView } from './views/CustomizeView.jsx';
import { HelpView } from './views/HelpView.jsx';
import { HistoryView } from './views/HistoryView.jsx';
import { AssistantView } from './views/AssistantView.jsx';
import { OnboardingView } from './views/OnboardingView.jsx';
import { AdvancedView } from './views/AdvancedView.jsx';
import './styles/app.css';

export function CheatingDaddyApp() {
    const [currentView, setCurrentView] = useState(() => 
        localStorage.getItem('onboardingCompleted') ? 'main' : 'onboarding'
    );
    const [statusText, setStatusText] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(() => 
        localStorage.getItem('selectedProfile') || 'interview'
    );
    const [selectedLanguage, setSelectedLanguage] = useState(() => 
        localStorage.getItem('selectedLanguage') || 'en-US'
    );
    const [selectedScreenshotInterval, setSelectedScreenshotInterval] = useState(() => 
        localStorage.getItem('selectedScreenshotInterval') || '5'
    );
    const [selectedImageQuality, setSelectedImageQuality] = useState(() => 
        localStorage.getItem('selectedImageQuality') || 'medium'
    );
    const [layoutMode, setLayoutMode] = useState(() => 
        localStorage.getItem('layoutMode') || 'normal'
    );
    const [advancedMode, setAdvancedMode] = useState(() => 
        localStorage.getItem('advancedMode') === 'true'
    );
    const [responses, setResponses] = useState([]);
    const [currentResponseIndex, setCurrentResponseIndex] = useState(-1);
    const [isClickThrough, setIsClickThrough] = useState(false);
    const [awaitingNewResponse, setAwaitingNewResponse] = useState(false);
    const [shouldAnimateResponse, setShouldAnimateResponse] = useState(false);
    const currentResponseIsCompleteRef = useRef(true);
    const mainViewRef = useRef(null);

    // Apply layout mode to document root
    useEffect(() => {
        if (layoutMode === 'compact') {
            document.documentElement.classList.add('compact-layout');
        } else {
            document.documentElement.classList.remove('compact-layout');
        }
    }, [layoutMode]);

    // Define handlers first (before they're used in useEffect)
    const handleSetStatus = useCallback((text) => {
        setStatusText(text);
        if (text.includes('Ready') || text.includes('Listening') || text.includes('Error')) {
            currentResponseIsCompleteRef.current = true;
        }
    }, []);

    const handleSetResponse = useCallback((response) => {
        const isFillerResponse =
            response.length < 30 &&
            (response.toLowerCase().includes('hmm') ||
                response.toLowerCase().includes('okay') ||
                response.toLowerCase().includes('next') ||
                response.toLowerCase().includes('go on') ||
                response.toLowerCase().includes('continue'));

        setResponses(prev => {
            if (awaitingNewResponse || prev.length === 0) {
                setCurrentResponseIndex(prev.length);
                setAwaitingNewResponse(false);
                currentResponseIsCompleteRef.current = false;
                return [...prev, response];
            } else if (!currentResponseIsCompleteRef.current && !isFillerResponse && prev.length > 0) {
                return [...prev.slice(0, prev.length - 1), response];
            } else {
                setCurrentResponseIndex(prev.length);
                currentResponseIsCompleteRef.current = false;
                return [...prev, response];
            }
        });
        setShouldAnimateResponse(true);
    }, [awaitingNewResponse]);

    // Register handlers with renderer.js for cheddar object
    useEffect(() => {
        if (window.registerReactApp) {
            window.registerReactApp({
                getCurrentView: () => currentView,
                getLayoutMode: () => layoutMode,
                setStatus: handleSetStatus,
                setResponse: handleSetResponse,
            });
            console.log('[React] Registered handlers with renderer.js');
        }
    }, [currentView, layoutMode, handleSetStatus, handleSetResponse]);

    // Set up IPC listeners (after handlers are defined)
    useEffect(() => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            
            const handleUpdateResponse = (_, response) => {
                handleSetResponse(response);
            };
            
            const handleUpdateStatus = (_, status) => {
                handleSetStatus(status);
            };
            
            const handleClickThroughToggled = (_, isEnabled) => {
                setIsClickThrough(isEnabled);
            };

            ipcRenderer.on('update-response', handleUpdateResponse);
            ipcRenderer.on('update-status', handleUpdateStatus);
            ipcRenderer.on('click-through-toggled', handleClickThroughToggled);

            return () => {
                ipcRenderer.removeListener('update-response', handleUpdateResponse);
                ipcRenderer.removeListener('update-status', handleUpdateStatus);
                ipcRenderer.removeListener('click-through-toggled', handleClickThroughToggled);
            };
        }
    }, [handleSetResponse, handleSetStatus, setIsClickThrough]);

    // Notify main process of view changes
    useEffect(() => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('view-changed', currentView);
        }
    }, [currentView]);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('selectedProfile', selectedProfile);
    }, [selectedProfile]);

    useEffect(() => {
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }, [selectedLanguage]);

    useEffect(() => {
        localStorage.setItem('selectedScreenshotInterval', selectedScreenshotInterval);
    }, [selectedScreenshotInterval]);

    useEffect(() => {
        localStorage.setItem('selectedImageQuality', selectedImageQuality);
    }, [selectedImageQuality]);

    useEffect(() => {
        localStorage.setItem('layoutMode', layoutMode);
    }, [layoutMode]);

    useEffect(() => {
        localStorage.setItem('advancedMode', advancedMode.toString());
    }, [advancedMode]);

    // Header event handlers
    const handleCustomizeClick = () => setCurrentView('customize');
    const handleHelpClick = () => setCurrentView('help');
    const handleHistoryClick = () => setCurrentView('history');
    const handleAdvancedClick = () => setCurrentView('advanced');

    const handleClose = async () => {
        if (currentView === 'customize' || currentView === 'help' || currentView === 'history') {
            setCurrentView('main');
        } else if (currentView === 'assistant') {
            if (window.cheddar) {
                window.cheddar.stopCapture();
            }
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('close-session');
            }
            setSessionActive(false);
            setCurrentView('main');
        } else {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('quit-application');
            }
        }
    };

    const handleHideToggle = async () => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('toggle-window-visibility');
        }
    };

    // Main view event handlers
    const handleStart = async () => {
        const apiKey = localStorage.getItem('apiKey')?.trim();
        if (!apiKey || apiKey === '') {
            if (mainViewRef.current?.triggerApiKeyError) {
                mainViewRef.current.triggerApiKeyError();
            }
            return;
        }

        if (window.cheddar) {
            await window.cheddar.initializeGemini(selectedProfile, selectedLanguage);
            window.cheddar.startCapture(selectedScreenshotInterval, selectedImageQuality);
        } else {
            console.error('cheddar object not available');
        }
        setResponses([]);
        setCurrentResponseIndex(-1);
        setStartTime(Date.now());
        setCurrentView('assistant');
    };

    const handleAPIKeyHelp = async () => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', 'https://cheatingdaddy.com/help/api-key');
        }
    };

    // Customize view event handlers
    const handleProfileChange = (profile) => setSelectedProfile(profile);
    const handleLanguageChange = (language) => setSelectedLanguage(language);
    const handleScreenshotIntervalChange = (interval) => setSelectedScreenshotInterval(interval);
    const handleImageQualityChange = (quality) => {
        setSelectedImageQuality(quality);
        localStorage.setItem('selectedImageQuality', quality);
    };
    const handleAdvancedModeChange = (mode) => {
        setAdvancedMode(mode);
        localStorage.setItem('advancedMode', mode.toString());
    };
    const handleBackClick = () => setCurrentView('main');

    // Help view event handlers
    const handleExternalLinkClick = async (url) => {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', url);
        }
    };

    // Assistant view event handlers
    const handleSendText = async (message) => {
        if (!window.cheddar) {
            handleSetStatus('Error: Application not ready');
            return;
        }
        const result = await window.cheddar.sendTextMessage(message);
        if (!result || !result.success) {
            handleSetStatus('Error sending message: ' + (result?.error || 'Unknown error'));
        } else {
            handleSetStatus('Message sent...');
            setAwaitingNewResponse(true);
        }
    };

    const handleResponseIndexChanged = (index) => {
        setCurrentResponseIndex(index);
        setShouldAnimateResponse(false);
    };

    const handleOnboardingComplete = () => setCurrentView('main');

    const handleLayoutModeChange = async (mode) => {
        setLayoutMode(mode);
        localStorage.setItem('layoutMode', mode);
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-sizes');
            } catch (error) {
                console.error('Failed to update sizes in main process:', error);
            }
        }
    };

    const handleResponseAnimationComplete = () => {
        setShouldAnimateResponse(false);
        currentResponseIsCompleteRef.current = true;
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'onboarding':
                return (
                    <OnboardingView
                        onComplete={handleOnboardingComplete}
                        onClose={handleClose}
                    />
                );
            case 'main':
                return (
                    <MainView
                        ref={mainViewRef}
                        onStart={handleStart}
                        onAPIKeyHelp={handleAPIKeyHelp}
                        onLayoutModeChange={handleLayoutModeChange}
                    />
                );
            case 'customize':
                return (
                    <CustomizeView
                        selectedProfile={selectedProfile}
                        selectedLanguage={selectedLanguage}
                        selectedScreenshotInterval={selectedScreenshotInterval}
                        selectedImageQuality={selectedImageQuality}
                        layoutMode={layoutMode}
                        advancedMode={advancedMode}
                        onProfileChange={handleProfileChange}
                        onLanguageChange={handleLanguageChange}
                        onScreenshotIntervalChange={handleScreenshotIntervalChange}
                        onImageQualityChange={handleImageQualityChange}
                        onLayoutModeChange={handleLayoutModeChange}
                        onAdvancedModeChange={handleAdvancedModeChange}
                    />
                );
            case 'help':
                return <HelpView onExternalLinkClick={handleExternalLinkClick} />;
            case 'history':
                return <HistoryView />;
            case 'advanced':
                return <AdvancedView />;
            case 'assistant':
                return (
                    <AssistantView
                        responses={responses}
                        currentResponseIndex={currentResponseIndex}
                        selectedProfile={selectedProfile}
                        onSendText={handleSendText}
                        shouldAnimateResponse={shouldAnimateResponse}
                        onResponseIndexChanged={handleResponseIndexChanged}
                        onResponseAnimationComplete={handleResponseAnimationComplete}
                    />
                );
            default:
                return <div>Unknown view: {currentView}</div>;
        }
    };

    const getMainContentClass = () => {
        let className = 'main-content';
        if (currentView === 'assistant') {
            className += ' assistant-view';
        } else if (currentView === 'onboarding') {
            className += ' onboarding-view';
        } else {
            className += ' with-border';
        }
        return className;
    };

    return (
        <div className="window-container">
            <div className="container">
                <AppHeader
                    currentView={currentView}
                    statusText={statusText}
                    startTime={startTime}
                    advancedMode={advancedMode}
                    onCustomizeClick={handleCustomizeClick}
                    onHelpClick={handleHelpClick}
                    onHistoryClick={handleHistoryClick}
                    onAdvancedClick={handleAdvancedClick}
                    onCloseClick={handleClose}
                    onBackClick={handleBackClick}
                    onHideToggleClick={handleHideToggle}
                    isClickThrough={isClickThrough}
                />
                <div className={getMainContentClass()}>
                    <div className="view-container">
                        {renderCurrentView()}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export for global access - this will be exposed by esbuild's globalName
export function initializeReactApp() {
    console.log('[React] initializeReactApp called');
    const container = document.getElementById('react-root');
    if (!container) {
        console.error('[React] React root container (#react-root) not found!');
        // Show error on page
        if (document.body) {
            document.body.innerHTML = '<div style="padding: 20px; color: #ff4444; background: #1a1a1a; font-family: monospace;">Error: React root container not found. Check console for details.</div>';
        }
        return;
    }
    console.log('[React] Found react-root container, creating React root...');
    try {
        const root = createRoot(container);
        root.render(React.createElement(CheatingDaddyApp));
        console.log('[React] ✅ React app rendered successfully!');
    } catch (error) {
        console.error('[React] ❌ Error rendering React app:', error);
        console.error('[React] Error stack:', error.stack);
        // Show error on page
        container.innerHTML = '<div style="padding: 20px; color: #ff4444; background: #1a1a1a; font-family: monospace; white-space: pre-wrap;">Error: ' + error.message + '\n\n' + error.stack + '</div>';
        throw error;
    }
}

// Make sure it's available on window after bundle loads
// The IIFE format with globalName will assign the module to window.CheatingDaddyApp
// But we need to ensure initializeReactApp is accessible
if (typeof window !== 'undefined') {
    // This will run when the bundle loads
    // The esbuild IIFE will assign the module exports to window.CheatingDaddyApp
    // So window.CheatingDaddyApp.initializeReactApp should be available
    console.log('[React] Module loaded, checking window.CheatingDaddyApp...');
}

