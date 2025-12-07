import React, { useState, useEffect } from 'react';

const profiles = [
    { value: 'interview', name: 'Job Interview', description: 'Get help with answering interview questions' },
    { value: 'sales', name: 'Sales Call', description: 'Assist with sales conversations and objection handling' },
    { value: 'meeting', name: 'Business Meeting', description: 'Support for professional meetings and discussions' },
    { value: 'presentation', name: 'Presentation', description: 'Help with presentations and public speaking' },
    { value: 'negotiation', name: 'Negotiation', description: 'Guidance for business negotiations and deals' },
    { value: 'exam', name: 'Exam Assistant', description: 'Academic assistance for test-taking and exam questions' },
];

const languages = [
    { value: 'en-US', name: 'English (US)' },
    { value: 'en-GB', name: 'English (UK)' },
    { value: 'en-AU', name: 'English (Australia)' },
    { value: 'en-IN', name: 'English (India)' },
    { value: 'de-DE', name: 'German (Germany)' },
    { value: 'es-US', name: 'Spanish (United States)' },
    { value: 'es-ES', name: 'Spanish (Spain)' },
    { value: 'fr-FR', name: 'French (France)' },
    { value: 'fr-CA', name: 'French (Canada)' },
    { value: 'hi-IN', name: 'Hindi (India)' },
    { value: 'pt-BR', name: 'Portuguese (Brazil)' },
    { value: 'ar-XA', name: 'Arabic (Generic)' },
    { value: 'id-ID', name: 'Indonesian (Indonesia)' },
    { value: 'it-IT', name: 'Italian (Italy)' },
    { value: 'ja-JP', name: 'Japanese (Japan)' },
    { value: 'tr-TR', name: 'Turkish (Turkey)' },
    { value: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { value: 'ko-KR', name: 'Korean (South Korea)' },
    { value: 'cmn-CN', name: 'Mandarin Chinese (China)' },
    { value: 'ru-RU', name: 'Russian (Russia)' },
];

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

export function CustomizeView({
    selectedProfile,
    selectedLanguage,
    selectedScreenshotInterval,
    selectedImageQuality,
    layoutMode,
    advancedMode,
    onProfileChange,
    onLanguageChange,
    onScreenshotIntervalChange,
    onImageQualityChange,
    onLayoutModeChange,
    onAdvancedModeChange
}) {
    const [customPrompt, setCustomPrompt] = useState(() => localStorage.getItem('customPrompt') || '');
    const [googleSearchEnabled, setGoogleSearchEnabled] = useState(() => {
        const val = localStorage.getItem('googleSearchEnabled');
        return val !== null ? val === 'true' : true;
    });
    const [backgroundTransparency, setBackgroundTransparency] = useState(() => {
        const val = localStorage.getItem('backgroundTransparency');
        return val !== null ? parseFloat(val) : 0.8;
    });
    const [fontSize, setFontSize] = useState(() => {
        const val = localStorage.getItem('fontSize');
        return val !== null ? parseInt(val, 10) : 20;
    });
    const [keybinds, setKeybinds] = useState(() => getDefaultKeybinds());
    const [audioMode, setAudioMode] = useState(() => localStorage.getItem('audioMode') || 'speaker_only');
    const [stealthProfile, setStealthProfile] = useState(() => localStorage.getItem('stealthProfile') || 'balanced');

    useEffect(() => {
        resizeLayout();
        loadKeybinds();
        updateBackgroundTransparency();
        updateFontSize();
    }, []);

    // Update transparency when value changes
    useEffect(() => {
        updateBackgroundTransparency();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundTransparency]);

    // Update font size when value changes
    useEffect(() => {
        updateFontSize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fontSize]);

    function getDefaultKeybinds() {
        const isMac = typeof window !== 'undefined' && (window.cheddar?.isMacOS || navigator.platform.includes('Mac'));
        return {
            moveUp: isMac ? 'Alt+Up' : 'Ctrl+Up',
            moveDown: isMac ? 'Alt+Down' : 'Ctrl+Down',
            moveLeft: isMac ? 'Alt+Left' : 'Ctrl+Left',
            moveRight: isMac ? 'Alt+Right' : 'Ctrl+Right',
            toggleVisibility: isMac ? 'Cmd+\\' : 'Ctrl+\\',
            toggleClickThrough: isMac ? 'Cmd+M' : 'Ctrl+M',
            nextStep: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
            previousResponse: isMac ? 'Cmd+[' : 'Ctrl+[',
            nextResponse: isMac ? 'Cmd+]' : 'Ctrl+]',
            scrollUp: isMac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
            scrollDown: isMac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
        };
    }

    function loadKeybinds() {
        const savedKeybinds = localStorage.getItem('customKeybinds');
        if (savedKeybinds) {
            try {
                setKeybinds({ ...getDefaultKeybinds(), ...JSON.parse(savedKeybinds) });
            } catch (e) {
                console.error('Failed to parse saved keybinds:', e);
            }
        }
    }

    function saveKeybinds(newKeybinds) {
        localStorage.setItem('customKeybinds', JSON.stringify(newKeybinds));
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', newKeybinds);
        }
    }

    function handleKeybindChange(action, value) {
        const newKeybinds = { ...keybinds, [action]: value };
        setKeybinds(newKeybinds);
        saveKeybinds(newKeybinds);
    }

    function resetKeybinds() {
        const defaults = getDefaultKeybinds();
        setKeybinds(defaults);
        localStorage.removeItem('customKeybinds');
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', defaults);
        }
    }

    function handleKeybindInput(e, action) {
        e.preventDefault();

        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.metaKey) modifiers.push('Cmd');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        let mainKey = e.key;

        switch (e.code) {
            case 'ArrowUp': mainKey = 'Up'; break;
            case 'ArrowDown': mainKey = 'Down'; break;
            case 'ArrowLeft': mainKey = 'Left'; break;
            case 'ArrowRight': mainKey = 'Right'; break;
            case 'Enter': mainKey = 'Enter'; break;
            case 'Space': mainKey = 'Space'; break;
            case 'Backslash': mainKey = '\\'; break;
            default:
                if (e.key.length === 1) {
                    mainKey = e.key.toUpperCase();
                }
        }

        if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

        const keybind = [...modifiers, mainKey].join('+');
        handleKeybindChange(action, keybind);
        e.target.blur();
    }

    function updateBackgroundTransparency() {
        const root = document.documentElement;
        // Update new design system variables
        root.style.setProperty('--bg-secondary', `rgba(15, 15, 20, ${backgroundTransparency})`);
        root.style.setProperty('--bg-tertiary', `rgba(20, 20, 30, ${backgroundTransparency})`);
        root.style.setProperty('--bg-glass', `rgba(255, 255, 255, ${backgroundTransparency * 0.05})`);
        root.style.setProperty('--bg-glass-hover', `rgba(255, 255, 255, ${backgroundTransparency * 0.08})`);
        root.style.setProperty('--bg-card', `rgba(255, 255, 255, ${backgroundTransparency * 0.03})`);
        root.style.setProperty('--bg-card-hover', `rgba(255, 255, 255, ${backgroundTransparency * 0.06})`);
        root.style.setProperty('--input-background', `rgba(0, 0, 0, ${backgroundTransparency * 0.3})`);
        root.style.setProperty('--input-focus-background', `rgba(0, 0, 0, ${backgroundTransparency * 0.5})`);
        // Also update legacy variables for compatibility
        root.style.setProperty('--header-background', `rgba(0, 0, 0, ${backgroundTransparency})`);
        root.style.setProperty('--main-content-background', `rgba(0, 0, 0, ${backgroundTransparency})`);
        root.style.setProperty('--card-background', `rgba(255, 255, 255, ${backgroundTransparency * 0.05})`);
        root.style.setProperty('--button-background', `rgba(0, 0, 0, ${backgroundTransparency * 0.5})`);
    }

    function updateFontSize() {
        const root = document.documentElement;
        // Update response font size
        root.style.setProperty('--response-font-size', `${fontSize}px`);
        // Also update the text-lg variable used in response container
        root.style.setProperty('--text-lg', `${fontSize}px`);
    }

    const handleProfileSelect = (e) => {
        onProfileChange(e.target.value);
        localStorage.setItem('selectedProfile', e.target.value);
    };

    const handleLanguageSelect = (e) => {
        onLanguageChange(e.target.value);
        localStorage.setItem('selectedLanguage', e.target.value);
    };

    const handleScreenshotIntervalSelect = (e) => {
        onScreenshotIntervalChange(e.target.value);
        localStorage.setItem('selectedScreenshotInterval', e.target.value);
    };

    const handleImageQualitySelect = (e) => {
        onImageQualityChange(e.target.value);
    };

    const handleLayoutModeSelect = (e) => {
        onLayoutModeChange(e.target.value);
        localStorage.setItem('layoutMode', e.target.value);
    };

    const handleCustomPromptInput = (e) => {
        setCustomPrompt(e.target.value);
        localStorage.setItem('customPrompt', e.target.value);
    };

    const handleGoogleSearchChange = async (e) => {
        const checked = e.target.checked;
        setGoogleSearchEnabled(checked);
        localStorage.setItem('googleSearchEnabled', checked.toString());
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-google-search-setting', checked);
            } catch (error) {
                console.error('Failed to notify main process:', error);
            }
        }
    };

    const handleBackgroundTransparencyChange = (e) => {
        const val = parseFloat(e.target.value);
        setBackgroundTransparency(val);
        localStorage.setItem('backgroundTransparency', val.toString());
        updateBackgroundTransparency();
        // Notify main process to update window opacity if needed
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-transparency', val);
        }
    };

    const handleFontSizeChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setFontSize(val);
        localStorage.setItem('fontSize', val.toString());
        updateFontSize();
    };

    const handleAdvancedModeChange = (e) => {
        onAdvancedModeChange(e.target.checked);
    };

    const handleAudioModeChange = (e) => {
        setAudioMode(e.target.value);
        localStorage.setItem('audioMode', e.target.value);
    };

    const handleStealthProfileChange = (e) => {
        setStealthProfile(e.target.value);
        localStorage.setItem('stealthProfile', e.target.value);
        alert('Restart the application for stealth changes to take full effect.');
    };

    const currentProfile = profiles.find(p => p.value === selectedProfile);
    const currentLanguage = languages.find(l => l.value === selectedLanguage);

    const keybindActions = [
        { key: 'moveUp', name: 'Move Window Up', description: 'Move the application window up' },
        { key: 'moveDown', name: 'Move Window Down', description: 'Move the application window down' },
        { key: 'moveLeft', name: 'Move Window Left', description: 'Move the application window left' },
        { key: 'moveRight', name: 'Move Window Right', description: 'Move the application window right' },
        { key: 'toggleVisibility', name: 'Toggle Window Visibility', description: 'Show/hide the application window' },
        { key: 'toggleClickThrough', name: 'Toggle Click-through Mode', description: 'Enable/disable click-through functionality' },
        { key: 'nextStep', name: 'Ask Next Step', description: 'Take screenshot and ask AI for the next step suggestion' },
        { key: 'previousResponse', name: 'Previous Response', description: 'Navigate to the previous AI response' },
        { key: 'nextResponse', name: 'Next Response', description: 'Navigate to the next AI response' },
        { key: 'scrollUp', name: 'Scroll Response Up', description: 'Scroll the AI response content up' },
        { key: 'scrollDown', name: 'Scroll Response Down', description: 'Scroll the AI response content down' },
    ];

    return (
        <div className="customize-view">
            <div className="settings-container">
                {/* AI Profile & Behavior Section */}
                <div className="settings-section">
                    <div className="section-title">AI Profile & Behavior</div>
                    <div className="form-grid">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Profile Type
                                    <span className="current-selection">{currentProfile?.name || 'Unknown'}</span>
                                </label>
                                <select className="form-control" value={selectedProfile} onChange={handleProfileSelect}>
                                    {profiles.map(profile => (
                                        <option key={profile.value} value={profile.value}>{profile.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label className="form-label">Custom AI Instructions</label>
                            <textarea
                                className="form-control"
                                placeholder={`Add specific instructions for how you want the AI to behave during ${profileNames[selectedProfile] || 'this interaction'}...`}
                                value={customPrompt}
                                rows="4"
                                onChange={handleCustomPromptInput}
                            />
                            <div className="form-description">
                                Personalize the AI's behavior with specific instructions that will be added to the {profileNames[selectedProfile] || 'selected profile'} base prompts
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audio & Microphone Section */}
                <div className="settings-section">
                    <div className="section-title">Audio & Microphone</div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Audio Mode</label>
                            <select className="form-control" value={audioMode} onChange={handleAudioModeChange}>
                                <option value="speaker_only">Speaker Only (Interviewer)</option>
                                <option value="mic_only">Microphone Only (Me)</option>
                                <option value="both">Both Speaker & Microphone</option>
                            </select>
                            <div className="form-description">Choose which audio sources to capture for the AI.</div>
                        </div>
                    </div>
                </div>

                {/* Stealth Profile Section */}
                <div className="settings-section">
                    <div className="section-title">Stealth Profile</div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Profile</label>
                            <select className="form-control" value={stealthProfile} onChange={handleStealthProfileChange}>
                                <option value="visible">Visible</option>
                                <option value="balanced">Balanced</option>
                                <option value="ultra">Ultra-Stealth</option>
                            </select>
                            <div className="form-description">
                                Adjusts visibility and detection resistance. A restart is required for changes to apply.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Language & Audio Section */}
                <div className="settings-section">
                    <div className="section-title">Language & Audio</div>
                    <div className="form-grid">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Speech Language
                                    <span className="current-selection">{currentLanguage?.name || 'Unknown'}</span>
                                </label>
                                <select className="form-control" value={selectedLanguage} onChange={handleLanguageSelect}>
                                    {languages.map(language => (
                                        <option key={language.value} value={language.value}>{language.name}</option>
                                    ))}
                                </select>
                                <div className="form-description">Language for speech recognition and AI responses</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interface Layout Section */}
                <div className="settings-section">
                    <div className="section-title">Interface Layout</div>
                    <div className="form-grid">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Layout Mode
                                    <span className="current-selection">{layoutMode === 'compact' ? 'Compact' : 'Normal'}</span>
                                </label>
                                <select className="form-control" value={layoutMode} onChange={handleLayoutModeSelect}>
                                    <option value="normal">Normal</option>
                                    <option value="compact">Compact</option>
                                </select>
                                <div className="form-description">
                                    {layoutMode === 'compact'
                                        ? 'Smaller window size with reduced padding and font sizes for minimal screen footprint'
                                        : 'Standard layout with comfortable spacing and font sizes'}
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <div className="slider-container">
                                <div className="slider-header">
                                    <label className="form-label">Background Transparency</label>
                                    <span className="slider-value">{Math.round(backgroundTransparency * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    className="slider-input"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={backgroundTransparency}
                                    onChange={handleBackgroundTransparencyChange}
                                />
                                <div className="slider-labels">
                                    <span>Transparent</span>
                                    <span>Opaque</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <div className="slider-container">
                                <div className="slider-header">
                                    <label className="form-label">Response Font Size</label>
                                    <span className="slider-value">{fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    className="slider-input"
                                    min="12"
                                    max="32"
                                    step="1"
                                    value={fontSize}
                                    onChange={handleFontSizeChange}
                                />
                                <div className="slider-labels">
                                    <span>12px</span>
                                    <span>32px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Screen Capture Section */}
                <div className="settings-section">
                    <div className="section-title">Screen Capture Settings</div>
                    <div className="form-grid">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Capture Interval
                                    <span className="current-selection">
                                        {selectedScreenshotInterval === 'manual' ? 'Manual' : selectedScreenshotInterval + 's'}
                                    </span>
                                </label>
                                <select className="form-control" value={selectedScreenshotInterval} onChange={handleScreenshotIntervalSelect}>
                                    <option value="manual">Manual (On demand)</option>
                                    <option value="1">Every 1 second</option>
                                    <option value="2">Every 2 seconds</option>
                                    <option value="5">Every 5 seconds</option>
                                    <option value="10">Every 10 seconds</option>
                                </select>
                                <div className="form-description">
                                    {selectedScreenshotInterval === 'manual'
                                        ? 'Screenshots will only be taken when you use the "Ask Next Step" shortcut'
                                        : 'Automatic screenshots will be taken at the specified interval'}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Image Quality
                                    <span className="current-selection">
                                        {selectedImageQuality.charAt(0).toUpperCase() + selectedImageQuality.slice(1)}
                                    </span>
                                </label>
                                <select className="form-control" value={selectedImageQuality} onChange={handleImageQualitySelect}>
                                    <option value="high">High Quality</option>
                                    <option value="medium">Medium Quality</option>
                                    <option value="low">Low Quality</option>
                                </select>
                                <div className="form-description">
                                    {selectedImageQuality === 'high'
                                        ? 'Best quality, uses more tokens'
                                        : selectedImageQuality === 'medium'
                                            ? 'Balanced quality and token usage'
                                            : 'Lower quality, uses fewer tokens'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Section */}
                <div className="settings-section">
                    <div className="section-title">Keyboard Shortcuts</div>
                    <table className="keybinds-table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Shortcut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keybindActions.map(action => (
                                <tr key={action.key}>
                                    <td>
                                        <div className="action-name">{action.name}</div>
                                        <div className="action-description">{action.description}</div>
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="form-control keybind-input"
                                            value={keybinds[action.key]}
                                            placeholder="Press keys..."
                                            readOnly
                                            onFocus={(e) => e.target.placeholder = 'Press key combination...'}
                                            onKeyDown={(e) => handleKeybindInput(e, action.key)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            <tr className="table-reset-row">
                                <td colSpan="2">
                                    <button className="reset-keybinds-button" onClick={resetKeybinds}>Reset to Defaults</button>
                                    <div className="form-description" style={{ marginTop: '8px' }}>
                                        Restore all keyboard shortcuts to their default values
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Google Search Section */}
                <div className="settings-section">
                    <div className="section-title">Google Search</div>
                    <div className="form-grid">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                id="google-search-enabled"
                                checked={googleSearchEnabled}
                                onChange={handleGoogleSearchChange}
                            />
                            <label htmlFor="google-search-enabled" className="checkbox-label">Enable Google Search</label>
                        </div>
                        <div className="form-description" style={{ marginLeft: '24px', marginTop: '-8px' }}>
                            Allow the AI to search Google for up-to-date information and facts during conversations
                            <br /><strong>Note:</strong> Changes take effect when starting a new AI session
                        </div>
                    </div>
                </div>

                <div className="settings-note">
                    💡 Settings are automatically saved as you change them. Changes will take effect immediately or on the next session start.
                </div>

                {/* Advanced Mode Section */}
                <div className="settings-section danger-section">
                    <div className="section-title danger-title">⚠️ Advanced Mode</div>
                    <div className="form-grid">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                id="advanced-mode"
                                checked={advancedMode}
                                onChange={handleAdvancedModeChange}
                            />
                            <label htmlFor="advanced-mode" className="checkbox-label">Enable Advanced Mode</label>
                        </div>
                        <div className="form-description" style={{ marginLeft: '24px', marginTop: '-8px' }}>
                            Unlock experimental features, developer tools, and advanced configuration options
                            <br /><strong>Note:</strong> Advanced mode adds a new icon to the main navigation bar
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


