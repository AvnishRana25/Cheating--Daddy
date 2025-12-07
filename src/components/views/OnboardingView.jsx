import React, { useState, useEffect, useRef } from 'react';

const ChevronLeft = () => (
    <svg width="16px" height="16px" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 6L9 12L15 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronRight = () => (
    <svg width="16px" height="16px" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const colorSchemes = [
    // Slide 1 - Welcome (Very dark purple/gray)
    [[25, 25, 35], [20, 20, 30], [30, 25, 40], [15, 15, 25], [35, 30, 45], [10, 10, 20]],
    // Slide 2 - Privacy (Dark blue-gray)
    [[20, 25, 35], [15, 20, 30], [25, 30, 40], [10, 15, 25], [30, 35, 45], [5, 10, 20]],
    // Slide 3 - Context (Dark neutral)
    [[25, 25, 25], [20, 20, 20], [30, 30, 30], [15, 15, 15], [35, 35, 35], [10, 10, 10]],
    // Slide 4 - Features (Dark green-gray)
    [[20, 30, 25], [15, 25, 20], [25, 35, 30], [10, 20, 15], [30, 40, 35], [5, 15, 10]],
    // Slide 5 - Complete (Dark warm gray)
    [[30, 25, 20], [25, 20, 15], [35, 30, 25], [20, 15, 10], [40, 35, 30], [15, 10, 5]],
];

const slides = [
    {
        icon: 'assets/onboarding/welcome.svg',
        title: 'Welcome to Cheating Daddy',
        content: 'Your AI assistant that listens and watches, then provides intelligent suggestions automatically during interviews and meetings.',
    },
    {
        icon: 'assets/onboarding/security.svg',
        title: 'Completely Private',
        content: 'Invisible to screen sharing apps and recording software. Your secret advantage stays completely hidden from others.',
    },
    {
        icon: 'assets/onboarding/context.svg',
        title: 'Add Your Context',
        content: 'Share relevant information to help the AI provide better, more personalized assistance.',
        showTextarea: true,
    },
    {
        icon: 'assets/onboarding/customize.svg',
        title: 'Additional Features',
        content: '',
        showFeatures: true,
    },
    {
        icon: 'assets/onboarding/ready.svg',
        title: 'Ready to Go',
        content: 'Add your Gemini API key in settings and start getting AI-powered assistance in real-time.',
    },
];

export function OnboardingView({ onComplete, onClose }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [contextText, setContextText] = useState('');
    const canvasRef = useRef(null);
    const animationIdRef = useRef(null);
    const isTransitioningRef = useRef(false);
    const transitionStartTimeRef = useRef(0);
    const previousColorSchemeRef = useRef(null);

    const transitionDuration = 800;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const interpolateColorSchemes = (scheme1, scheme2, progress) => {
            return scheme1.map((color1, index) => {
                const color2 = scheme2[index];
                return [
                    color1[0] + (color2[0] - color1[0]) * progress,
                    color1[1] + (color2[1] - color1[1]) * progress,
                    color1[2] + (color2[2] - color1[2]) * progress,
                ];
            });
        };

        const drawGradient = (timestamp) => {
            const { width, height } = canvas;
            let colors = colorSchemes[currentSlide];

            if (isTransitioningRef.current && previousColorSchemeRef.current) {
                const elapsed = timestamp - transitionStartTimeRef.current;
                const progress = Math.min(elapsed / transitionDuration, 1);
                const easedProgress = easeInOutCubic(progress);
                colors = interpolateColorSchemes(previousColorSchemeRef.current, colorSchemes[currentSlide], easedProgress);
                
                if (progress >= 1) {
                    isTransitioningRef.current = false;
                    previousColorSchemeRef.current = null;
                }
            }

            const time = timestamp * 0.0005;
            const flowX = Math.sin(time * 0.7) * width * 0.3;
            const flowY = Math.cos(time * 0.5) * height * 0.2;

            const gradient = ctx.createLinearGradient(flowX, flowY, width + flowX * 0.5, height + flowY * 0.5);

            colors.forEach((color, index) => {
                const offset = index / (colors.length - 1);
                const wave = Math.sin(time + index * 0.3) * 0.05;
                const r = Math.max(0, Math.min(255, color[0] + wave * 5));
                const g = Math.max(0, Math.min(255, color[1] + wave * 5));
                const b = Math.max(0, Math.min(255, color[2] + wave * 5));
                gradient.addColorStop(offset, `rgb(${r}, ${g}, ${b})`);
            });

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            const centerX = width * 0.5 + Math.sin(time * 0.3) * width * 0.15;
            const centerY = height * 0.5 + Math.cos(time * 0.4) * height * 0.1;
            const radius = Math.max(width, height) * 0.8;

            const radialGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            radialGradient.addColorStop(0, `rgba(${colors[0][0] + 10}, ${colors[0][1] + 10}, ${colors[0][2] + 10}, 0.1)`);
            radialGradient.addColorStop(0.5, `rgba(${colors[2][0]}, ${colors[2][1]}, ${colors[2][2]}, 0.05)`);
            radialGradient.addColorStop(1, `rgba(${colors[colors.length - 1][0]}, ${colors[colors.length - 1][1]}, ${colors[colors.length - 1][2]}, 0.03)`);

            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = radialGradient;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';
        };

        const animate = (timestamp) => {
            drawGradient(timestamp);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate(0);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [currentSlide]);

    const startColorTransition = (newSlide) => {
        previousColorSchemeRef.current = [...colorSchemes[currentSlide]];
        isTransitioningRef.current = true;
        transitionStartTimeRef.current = performance.now();
        setCurrentSlide(newSlide);
    };

    const nextSlide = () => {
        if (currentSlide < 4) {
            startColorTransition(currentSlide + 1);
        } else {
            completeOnboarding();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            startColorTransition(currentSlide - 1);
        }
    };

    const handleContextInput = (e) => {
        setContextText(e.target.value);
    };

    const completeOnboarding = () => {
        if (contextText.trim()) {
            localStorage.setItem('customPrompt', contextText.trim());
        }
        localStorage.setItem('onboardingCompleted', 'true');
        onComplete();
    };

    const slide = slides[currentSlide];

    return (
        <div className="onboarding-view">
            <div className="onboarding-container">
                <canvas ref={canvasRef} className="gradient-canvas" />

                <div className="content-wrapper">
                    <img className="slide-icon" src={slide.icon} alt={`${slide.title} icon`} />
                    <div className="slide-title">{slide.title}</div>
                    <div className="slide-content">{slide.content}</div>

                    {slide.showTextarea && (
                        <textarea
                            className="context-textarea"
                            placeholder="Paste your resume, job description, or any relevant context here..."
                            value={contextText}
                            onChange={handleContextInput}
                        />
                    )}

                    {slide.showFeatures && (
                        <div className="feature-list">
                            <div className="feature-item">
                                <span className="feature-icon">🎨</span>
                                Customize AI behavior and responses
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">📚</span>
                                Review conversation history
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🔧</span>
                                Adjust capture settings and intervals
                            </div>
                        </div>
                    )}
                </div>

                <div className="navigation">
                    <button className="nav-button" onClick={prevSlide} disabled={currentSlide === 0}>
                        <ChevronLeft />
                    </button>

                    <div className="progress-dots">
                        {[0, 1, 2, 3, 4].map((index) => (
                            <div
                                key={index}
                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => {
                                    if (index !== currentSlide) {
                                        startColorTransition(index);
                                    }
                                }}
                            />
                        ))}
                    </div>

                    <button className="nav-button" onClick={nextSlide}>
                        {currentSlide === 4 ? 'Get Started' : <ChevronRight />}
                    </button>
                </div>
            </div>
        </div>
    );
}


