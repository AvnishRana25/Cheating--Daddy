import React, { useState, useEffect } from 'react';

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

export function AdvancedView() {
    const [isClearing, setIsClearing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('');
    const [throttleTokens, setThrottleTokens] = useState(true);
    const [maxTokensPerMin, setMaxTokensPerMin] = useState(1000000);
    const [throttleAtPercent, setThrottleAtPercent] = useState(75);
    const [contentProtection, setContentProtection] = useState(true);

    useEffect(() => {
        resizeLayout();
        loadRateLimitSettings();
        loadContentProtectionSetting();
    }, []);

    function loadRateLimitSettings() {
        const throttle = localStorage.getItem('throttleTokens');
        const maxTokens = localStorage.getItem('maxTokensPerMin');
        const throttlePercent = localStorage.getItem('throttleAtPercent');

        if (throttle !== null) setThrottleTokens(throttle === 'true');
        if (maxTokens !== null) setMaxTokensPerMin(parseInt(maxTokens, 10) || 1000000);
        if (throttlePercent !== null) setThrottleAtPercent(parseInt(throttlePercent, 10) || 75);
    }

    function loadContentProtectionSetting() {
        const protection = localStorage.getItem('contentProtection');
        setContentProtection(protection !== null ? protection === 'true' : true);
    }

    const handleThrottleTokensChange = (e) => {
        const checked = e.target.checked;
        setThrottleTokens(checked);
        localStorage.setItem('throttleTokens', checked.toString());
    };

    const handleMaxTokensChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setMaxTokensPerMin(value);
            localStorage.setItem('maxTokensPerMin', value.toString());
        }
    };

    const handleThrottlePercentChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            setThrottleAtPercent(value);
            localStorage.setItem('throttleAtPercent', value.toString());
        }
    };

    const resetRateLimitSettings = () => {
        setThrottleTokens(true);
        setMaxTokensPerMin(1000000);
        setThrottleAtPercent(75);
        localStorage.removeItem('throttleTokens');
        localStorage.removeItem('maxTokensPerMin');
        localStorage.removeItem('throttleAtPercent');
    };

    const handleContentProtectionChange = async (e) => {
        const checked = e.target.checked;
        setContentProtection(checked);
        localStorage.setItem('contentProtection', checked.toString());

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            try {
                await ipcRenderer.invoke('update-content-protection', checked);
            } catch (error) {
                console.error('Failed to update content protection:', error);
            }
        }
    };

    const clearLocalData = async () => {
        if (isClearing) return;

        setIsClearing(true);
        setStatusMessage('');
        setStatusType('');

        try {
            localStorage.clear();
            sessionStorage.clear();

            const databases = await indexedDB.databases();
            const clearPromises = databases.map(db => {
                return new Promise((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name);
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => reject(deleteReq.error);
                    deleteReq.onblocked = () => {
                        console.warn(`Deletion of database ${db.name} was blocked`);
                        resolve();
                    };
                });
            });

            await Promise.all(clearPromises);

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            setStatusMessage(`✅ Successfully cleared all local data (${databases.length} databases, localStorage, sessionStorage, and caches)`);
            setStatusType('success');

            setTimeout(() => {
                setStatusMessage('🔄 Closing application...');
                setTimeout(async () => {
                    if (window.require) {
                        const { ipcRenderer } = window.require('electron');
                        await ipcRenderer.invoke('quit-application');
                    }
                }, 1000);
            }, 2000);
        } catch (error) {
            console.error('Error clearing data:', error);
            setStatusMessage(`❌ Error clearing data: ${error.message}`);
            setStatusType('error');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="advanced-view">
            <div className="advanced-container">
                {/* Content Protection Section */}
                <div className="advanced-section">
                    <div className="section-title">🔒 Content Protection</div>
                    <div className="advanced-description">
                        Content protection makes the application window invisible to screen sharing and recording software.
                        This is useful for privacy when sharing your screen, but may interfere with certain display setups like DisplayLink.
                    </div>

                    <div className="form-grid">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                id="content-protection"
                                checked={contentProtection}
                                onChange={handleContentProtectionChange}
                            />
                            <label htmlFor="content-protection" className="checkbox-label">
                                Enable content protection (stealth mode)
                            </label>
                        </div>
                        <div className="form-description" style={{ marginLeft: '22px' }}>
                            {contentProtection
                                ? 'The application is currently invisible to screen sharing and recording software.'
                                : 'The application is currently visible to screen sharing and recording software.'}
                        </div>
                    </div>
                </div>

                {/* Rate Limiting Section */}
                <div className="advanced-section">
                    <div className="section-title">⏱️ Rate Limiting</div>

                    <div className="rate-limit-warning">
                        <span className="rate-limit-warning-icon">⚠️</span>
                        <span>
                            <strong>Warning:</strong> Don't mess with these settings if you don't know what this is about. Incorrect rate limiting
                            settings may cause the application to stop working properly or hit API limits unexpectedly.
                        </span>
                    </div>

                    <div className="form-grid">
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                id="throttle-tokens"
                                checked={throttleTokens}
                                onChange={handleThrottleTokensChange}
                            />
                            <label htmlFor="throttle-tokens" className="checkbox-label">
                                Throttle tokens when close to rate limit
                            </label>
                        </div>

                        <div className={`rate-limit-controls ${throttleTokens ? 'enabled' : ''}`}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Max Allowed Tokens Per Minute</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={maxTokensPerMin}
                                        min="1000"
                                        max="10000000"
                                        step="1000"
                                        onChange={handleMaxTokensChange}
                                        disabled={!throttleTokens}
                                    />
                                    <div className="form-description">Maximum number of tokens allowed per minute before throttling kicks in</div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Throttle At Percent</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={throttleAtPercent}
                                        min="1"
                                        max="99"
                                        step="1"
                                        onChange={handleThrottlePercentChange}
                                        disabled={!throttleTokens}
                                    />
                                    <div className="form-description">
                                        Start throttling when this percentage of the limit is reached ({throttleAtPercent}% ={' '}
                                        {Math.floor((maxTokensPerMin * throttleAtPercent) / 100)} tokens)
                                    </div>
                                </div>
                            </div>

                            <div className="rate-limit-reset">
                                <button className="action-button" onClick={resetRateLimitSettings} disabled={!throttleTokens}>
                                    Reset to Defaults
                                </button>
                                <div className="form-description" style={{ marginTop: '8px' }}>
                                    Reset rate limiting settings to default values
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Management Section */}
                <div className="advanced-section danger-section">
                    <div className="section-title danger-title">🗑️ Data Management</div>
                    <div className="danger-box">
                        <span className="danger-icon">⚠️</span>
                        <span>
                            <strong>Important:</strong> This action will permanently delete all local data and cannot be undone.
                        </span>
                    </div>

                    <div>
                        <button className="action-button danger-button" onClick={clearLocalData} disabled={isClearing}>
                            {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Local Data'}
                        </button>

                        {statusMessage && (
                            <div className={`status-message ${statusType === 'success' ? 'status-success' : 'status-error'}`}>
                                {statusMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


