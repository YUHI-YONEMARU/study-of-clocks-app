'use client'; // クライアントコンポーネントであることを宣言

import { useState, useEffect, useRef } from 'react';
import styles from './clock.module.css';

export default function ClockPage() {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragTarget, setDragTarget] = useState<'hour' | 'minute' | null>(null);
    const [showTime, setShowTime] = useState(false);
    const [showBonusQuestionButton, setShowBonusQuestionButton] = useState(false);
    const [showQuestion, setShowQuestion] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [showNextQuestionButton, setShowNextQuestionButton] = useState(false);
    const [questionCount, setQuestionCount] = useState(0); 
    const previousMinutesRef = useRef(minutes);

    useEffect(() => {
        const now = new Date();
        setHours(now.getHours());
        setMinutes(Math.round(now.getMinutes() / 5) * 5);
    }, []);

    // minutesが更新されるたびにrefを更新
    useEffect(() => {
        previousMinutesRef.current = minutes;
    }, [minutes]);

    // 時針と分針の角度を計算
    const hourDeg = (hours % 12) * 30 + (minutes * 0.5);
    const minuteDeg = minutes * 6;

    // 音声読み上げ関数
    const speakTime = () => {
        const text = `${hours}時${minutes}分`;
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            window.speechSynthesis.speak(utterance);
        }
    };

    // マウス/タップ開始時の処理
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clock = e.currentTarget as HTMLElement;
        const rect = clock.getBoundingClientRect();
        const clockCenterX = rect.left + rect.width / 2;
        const clockCenterY = rect.top + rect.height / 2;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - clockCenterX;
        const deltaY = clientY - clockCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 針の長さ（CSSと合わせる）
        const hourHandLength = 60;
        const minuteHandLength = 90;

        // タップ位置でドラッグする針を決定
        if (distance < minuteHandLength * 0.8 && distance > hourHandLength * 0.5) {
            setDragTarget('minute');
        } else if (distance < hourHandLength * 0.8) {
            setDragTarget('hour');
        } else {
            setDragTarget(null);
            setIsDragging(false);
        }
    };

    // マウス/タップ移動時の処理
    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !dragTarget) return;
        
        const clock = document.querySelector(`.${styles.clock}`) as HTMLElement;
        if (!clock) return;
        const rect = clock.getBoundingClientRect();
        const clockCenterX = rect.left + rect.width / 2;
        const clockCenterY = rect.top + rect.height / 2;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const angleRad = Math.atan2(clientY - clockCenterY, clientX - clockCenterX);
        let angleDeg = angleRad * (180 / Math.PI) + 90;
        if (angleDeg < 0) {
            angleDeg += 360;
        }

        if (dragTarget === 'minute') {
            const _newMinutes = Math.round(angleDeg / 6 / 5) * 5;
            const newMinutes = _newMinutes === 60 ? 0 : _newMinutes;
            setMinutes(newMinutes);

            const prevMinutes = previousMinutesRef.current;
            if (prevMinutes === 55 && newMinutes === 0) {
                setHours((prevHours) => (prevHours === 12 ? 1 : prevHours + 1));
            } else if (prevMinutes === 0 && newMinutes === 55) {
                setHours((prevHours) => (prevHours === 1 ? 12 : prevHours - 1));
            }

        } else if (dragTarget === 'hour') {
            const newHours = Math.round(angleDeg / 30);
            setHours(newHours === 0 ? 12 : newHours);
        }
    };

    // マウス/タップ終了時の処理
    const handleEnd = () => {
        setIsDragging(false);
        setDragTarget(null);
    };


    // ランダムな5の倍数を生成する関数
    const generateRandomQuestion = (count: number) => {
        let number;
        if (count === 1) {
            // 1問目は5から20
            const randomMultiplier = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, 4
            number = randomMultiplier * 5;
        } else {
            // 2問目と3問目は25から55
            const randomMultiplier = Math.floor(Math.random() * 7) + 5; // 5, 6, ..., 11
            number = randomMultiplier * 5;
        }
        setQuestionNumber(number);
    };

    // 「こたえをみる」ボタンを押したときのハンドラー
    const handleShowTime = () => {
        setShowTime(true);
        // ボタンを非表示にし、次の問題を準備
        setShowBonusQuestionButton(true);
    };

    // 「おまけのもんだいをみる」ボタンを押したときのハンドラー
    const handleShowBonusQuestion = () => {
        setShowBonusQuestionButton(false);
        const nextCount = 1;
        setQuestionCount(nextCount);
        setShowNextQuestionButton(false);

        generateRandomQuestion(nextCount);
        setShowQuestion(true);
        setTimeout(() => {
            setShowNextQuestionButton(true);
        }, 500);
    };
    
    // 「つぎのもんだいをみる」ボタンを押したときのハンドラー
    const handleNextQuestion = () => {
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);
        setShowNextQuestionButton(false);

        if (nextCount <= 3) {
            generateRandomQuestion(nextCount);
            setShowQuestion(true);
            setTimeout(() => {
                setShowNextQuestionButton(true);
            }, 500);
        } else {
            // 3問目が終わったら終了メッセージを表示
            setShowQuestion(false);
        }
    };

    // イベントリスナーの設定
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        } else {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        }

        // クリーンアップ関数
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, dragTarget]);

    return (
        <div className={styles.container}>
            <h1>なんじなんぷん？</h1>
            <div 
                className={styles.clock}
            >
                <div 
                    className={styles.hourHand} 
                    style={{ transform: `rotate(${hourDeg}deg)` }}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                >
                <div className={styles.hourGrip}></div>
                </div>
                <div 
                    className={styles.minuteHand} 
                    style={{ transform: `rotate(${minuteDeg}deg)` }}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                >
                <div className={styles.minuteGrip}></div>
                </div>
                {/* 時刻の目盛り */}
                <div className={`${styles.number} ${styles.number1}`}>1</div>
                <div className={`${styles.number} ${styles.number2}`}>2</div>
                <div className={`${styles.number} ${styles.number3}`}>3</div>
                <div className={`${styles.number} ${styles.number4}`}>4</div>
                <div className={`${styles.number} ${styles.number5}`}>5</div>
                <div className={`${styles.number} ${styles.number6}`}>6</div>
                <div className={`${styles.number} ${styles.number7}`}>7</div>
                <div className={`${styles.number} ${styles.number8}`}>8</div>
                <div className={`${styles.number} ${styles.number9}`}>9</div>
                <div className={`${styles.number} ${styles.number10}`}>10</div>
                <div className={`${styles.number} ${styles.number11}`}>11</div>
                <div className={`${styles.number} ${styles.number12}`}>12</div>
                
                {/* 針 */}
                <div className={styles.hourHand} style={{ transform: `rotate(${hourDeg}deg)` }}></div>
                <div className={styles.minuteHand} style={{ transform: `rotate(${minuteDeg}deg)` }}></div>
                
                {/* 針の回転の中心 */}
                <div className={styles.centerDot}></div>
            </div>
            <div className={styles.timeDisplay}>
                {showTime ? (
                    <>
                        <p className={styles.time}>{hours}時{minutes}分 <button onClick={speakTime}>🔊</button></p>
                    </>
                ) : (
                    <button onClick={handleShowTime} className={styles.showTimeButton}>こたえをみる</button>
                )}

                {showBonusQuestionButton && (
                    <button onClick={handleShowBonusQuestion}>おまけのもんだいをみる</button>
                )}

                {/* おまけ問題の表示ロジック */}
                {questionCount > 0 && questionCount <= 3 && showQuestion && (
                    <p>
                        {questionNumber} 
                        {questionCount === 3 ? " ふんまえは？" : " ふんごは？"}
                    </p>
                )}
                
                {questionCount === 4 && (
                    <p>おつかれさまでした！</p>
                )}

                {showNextQuestionButton && questionCount < 3 && (
                    <button onClick={handleNextQuestion}>つぎのもんだいをみる</button>
                )}
            </div>
        </div>
    );
}