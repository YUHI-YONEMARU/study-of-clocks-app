'use client'; // クライアントコンポーネントであることを宣言

import { useState, useEffect, useRef } from 'react';
import styles from './clock.module.css';
import classnames from "classnames";
import { motion } from "framer-motion";

export default function ClockPage() {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [answerHours, setAnswerHours] = useState(0);
    const [answerMinutes, setAnswerMinutes] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragTarget, setDragTarget] = useState<'hour' | 'minute' | null>(null);
    const previousMinutesRef = useRef(minutes);
    
    const [showTime, setShowTime] = useState(false);
    const [showResetButton, setShowResetButton] = useState(false);
    const [showBonusQuestionButton, setShowBonusQuestionButton] = useState(false);
    const [showBonusQuestion, setShowBonusQuestion] = useState(false);
    const [bonusQuestionTime, setBonusQuestionTime] = useState({ hours: 0, minutes: 0 });
    const [showBonusQuestionAnswer, setShowBonusQuestionAnswer] = useState(false);
    const [showBonusQuestionAnswerButton, setShowBonusQuestionAnswerButton] = useState(false);

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
    const speakTime = (hoursToSpeak: number, minutesToSpeak: number) => {
        const text = `${hoursToSpeak}時${minutesToSpeak}分`;
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

    // 「こたえをみる」ボタンを押したときのハンドラー
    const handleShowTime = () => {
        setShowTime(true);
        setBonusQuestionTime({ hours, minutes }); // おまけ問題の基準時刻をセット
        setShowBonusQuestionButton(true);
        setShowResetButton(true);
    };

    const handleShowBonusQuestion = () => {
        setShowBonusQuestion(true);
        setShowBonusQuestionAnswerButton(true);
        setShowBonusQuestionButton(false);
    };

   // おまけ問題の答えを計算して表示する関数
    const handleShowBonusQuestionAnswer = () => {
        setShowBonusQuestionAnswer(true);
        setShowBonusQuestionAnswerButton(false);

        // 答えを計算し、状態にセット
        const totalMinutes = bonusQuestionTime.hours * 60 + bonusQuestionTime.minutes + selectedTimeOffset;
        let newHours = Math.floor(totalMinutes / 60);
        let newMinutes = totalMinutes % 60;

        if (newMinutes < 0) {
            newMinutes += 60;
            newHours -= 1;
        }

        if (newHours > 12) {
            newHours -= 12;
        } else if (newHours <= 0) {
            newHours += 12;
        }

        newMinutes = Math.round(newMinutes / 5) * 5;
        if (newMinutes === 60) {
            newMinutes = 0;
            newHours += 1;
            if (newHours > 12) {
                newHours -= 12;
            } else if (newHours === 0) {
                newHours = 12;
            }
        }
        
        setAnswerHours(newHours);
        setAnswerMinutes(newMinutes);
    };

    // リセット関数
    const handleReset = () => {
        setShowTime(false);
        setShowResetButton(false);
        setShowBonusQuestion(false);
        setShowBonusQuestionButton(false);
        setBonusQuestionTime({ hours: 0, minutes: 0 });
        setSelectedTimeOffset(generateRandomOffset());
        setShowBonusQuestionAnswer(false);
    };

    const generateRandomOffset = () => {
        // 0 から 24 までのランダムな整数を生成
        const randomIndex = Math.floor(Math.random() * 25);
        // そのインデックスに対応するオフセット値（-60から60）を計算
        return (randomIndex - 12) * 5;
    };
    const [selectedTimeOffset, setSelectedTimeOffset] = useState(generateRandomOffset());

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
                        <motion.p
                            className={styles.time}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {hours}時{minutes}分<button className={styles.speakTime} onClick={() => speakTime(hours, minutes)}>🔊</button>
                        </motion.p>
                ) : (
                    <>
                        <button className={classnames(styles.cardButton, styles.showTimeType)} onClick={handleShowTime}>こたえをみる</button>
                    </>
                )}

                {showBonusQuestionButton && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button className={classnames(styles.cardButton, styles.showBonusQuestionType)} onClick={handleShowBonusQuestion}>おまけのもんだいをみる</button>
                    </motion.p>
                )}

                {showBonusQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                    <div className={styles.bonusQuestion}>
                        では{bonusQuestionTime.hours}時{bonusQuestionTime.minutes}分の
                        <select
                            value={selectedTimeOffset}
                            onChange={(e) => setSelectedTimeOffset(parseInt(e.target.value))}
                        >
                        {[...Array(25)].map((_, i) => (i - 12) * 5)
                            .filter(offset => offset !== 0)
                            .map(offset => (
                                <option key={offset} value={offset}>
                                    {offset > 0 ? `${offset}分後` : `${-offset}分前`}
                                </option>
                        ))}
                        </select>
                        はなんじなんぷん？
                        {showBonusQuestionAnswerButton && (
                            <button className={classnames(styles.cardButton, styles.showBonusQuestionAnswerType)} onClick={handleShowBonusQuestionAnswer}>こたえをみる</button>
                        )}
                        {showBonusQuestionAnswer && (
                            <motion.p
                                className={styles.answer}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                こたえ：{answerHours}時{answerMinutes}分
                                <button className={styles.speakTime} onClick={() => speakTime(answerHours, answerMinutes)}>🔊</button>
                            </motion.p>
                        )}
                    </div>
                    </motion.div>
                )}
                {showResetButton && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button className={classnames(styles.cardButton, styles.resetType)} onClick={handleReset}>さいしょにもどす</button>
                    </motion.p>
                )}
            </div>
            
        </div>
    );
}