import { useState, useEffect, useCallback } from "react";
import { getGiftById, markGiftAsViewed, getContributions } from "@/services/gifts";
import { verifyGiftPin } from "@/services/pinSecurity";
import {
    checkRateLimit,
    resetRateLimit,
    getRemainingAttempts,
} from "@/utils/security";
import confetti from "canvas-confetti";

export function useGiftLogic(id, initialData) {
    const [gift, setGift] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState("");
    const [unlocked, setUnlocked] = useState(false);
    const [isTimeLocked, setIsTimeLocked] = useState(false);

    // Derived state
    const isPreview = !!initialData;
    const unlockTime = gift?.unlockDate
        ? typeof gift.unlockDate.toMillis === "function"
            ? gift.unlockDate.toMillis()
            : new Date(gift.unlockDate).getTime()
        : null;

    // 1. Initial Fetch
    useEffect(() => {
        if (initialData) {
            setGift(initialData);
            setLoading(false);
            return;
        }

        const fetchGift = async () => {
            try {
                const data = await getGiftById(id);
                // [NEW] Social Gifting: Fetch contributions and merge
                if (data) {
                    const contributions = await getContributions(id);
                    if (contributions.length > 0) {
                        // Merge contributions into messages
                        // Map contribution format to message format
                        const socialMessages = contributions.map(c => ({
                            id: c.id,
                            type: c.type || 'text',
                            content: c.content,
                            author: c.author,
                            isContribution: true // Marker for UI styling if needed
                        }));

                        // Combine: Main messages first, then social messages? Or mixed?
                        // For now append to end
                        data.messages = [...(data.messages || []), ...socialMessages];
                    }
                }
                setGift(data);
            } catch (error) {
                console.error("Failed to fetch gift", error);
                setError("Geschenk nicht gefunden.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchGift();
        } else {
            setLoading(false);
        }
    }, [id, initialData]);

    // 2. Time Lock Logic
    useEffect(() => {
        if (!unlockTime) {
            setIsTimeLocked(false);
            return;
        }

        const checkTime = () => {
            const now = Date.now();
            setIsTimeLocked(now < unlockTime);
        };

        checkTime();
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [unlockTime]);

    // 3. Auto-unlock (Bracelets) & Mark as Viewed
    useEffect(() => {
        if (gift && gift.productType === "bracelet") {
            setUnlocked(true);
            if (!gift.viewed && !isPreview) {
                markGiftAsViewed(id).catch((err) =>
                    console.error("Error marking as viewed", err)
                );
            }
        }
    }, [gift, id, isPreview]);

    // 4. Animation Trigger
    const triggerAnimation = useCallback((type) => {
        const duration = 3000;
        const end = Date.now() + duration;

        if (type === "hearts") {
            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ["#e11d48", "#be123c"],
                    shapes: ["heart"],
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ["#e11d48", "#be123c"],
                    shapes: ["heart"],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            })();
        } else if (type === "stars") {
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = end - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    shapes: ["star"],
                    colors: ["#FFD700", "#FFA500"],
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    shapes: ["star"],
                    colors: ["#FFD700", "#FFA500"],
                });
            }, 250);
        } else if (type === "confetti") {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#e11d48", "#10b981", "#3b82f6", "#f59e0b"],
            });
        }
    }, []);

    // 4b. Auto-unlock for Public Gifts (respecting Time Lock)
    useEffect(() => {
        if (!gift?.isPublic || unlocked) return;

        const now = Date.now();
        // Calculate lock status directly to prevent race condition on initial load
        const calculatedLock = unlockTime && now < unlockTime;

        if (!isTimeLocked && !calculatedLock) {
            setUnlocked(true);
            if (!gift.viewed && !isPreview) {
                markGiftAsViewed(id).catch((err) =>
                    console.error("Error marking as viewed", err)
                );
            }
            if (gift.openingAnimation && gift.openingAnimation !== "none") {
                setTimeout(() => triggerAnimation(gift.openingAnimation), 500);
            }
        }
    }, [gift, unlocked, isTimeLocked, unlockTime, isPreview, id, triggerAnimation]);

    // 5. Verify PIN / Handle Unlock
    const verifyPin = async (pinInput) => {
        if (!gift) {
            setError("Geschenk nicht gefunden.");
            return;
        }
        if (!pinInput) {
            setError("Bitte gib einen PIN Code ein.");
            return;
        }
        if (!id) {
            setError("Geschenk-ID fehlt.");
            return;
        }

        if (checkRateLimit(`pin_${id}`)) {
            const remaining = getRemainingAttempts(`pin_${id}`);
            setError(
                `Zu viele Versuche. Bitte warte eine Stunde. (${remaining} Versuche übrig)`
            );
            return;
        }

        setError("");

        try {
            const response = await verifyGiftPin(id, pinInput.trim());

            const isValid = typeof response === "boolean" ? response : response.match;
            const fullGiftData =
                typeof response === "object" ? response.giftData : null;
            const responseIsTimeLocked =
                typeof response === "object" ? response.isTimeLocked : false;
            const responseUnlockDate =
                typeof response === "object" ? response.unlockDate : null;

            if (responseIsTimeLocked) {
                if (responseUnlockDate) {
                    setGift((prev) => ({ ...prev, unlockDate: responseUnlockDate }));
                }
                setError("Dieses Geschenk ist noch nicht freigeschaltet.");
                return;
            }

            if (isValid) {
                resetRateLimit(`pin_${id}`);
                setUnlocked(true);
                if (fullGiftData) {
                    // [NEW] Social Gifting: Merge server-side fetched contributions
                    if (fullGiftData.contributions && fullGiftData.contributions.length > 0) {
                        const socialMessages = fullGiftData.contributions.map(c => ({
                            id: c.id,
                            type: c.type || 'text',
                            content: c.content,
                            author: c.author,
                            isContribution: true
                        }));
                        fullGiftData.messages = [...(fullGiftData.messages || []), ...socialMessages];
                    }
                    setGift(fullGiftData);
                }
                if (!gift.viewed && !isPreview) {
                    markGiftAsViewed(id).catch((err) =>
                        console.error("Error marking as viewed", err)
                    );
                }
                if (gift.openingAnimation && gift.openingAnimation !== "none") {
                    setTimeout(() => triggerAnimation(gift.openingAnimation), 500);
                }
            } else {
                const remaining = getRemainingAttempts(`pin_${id}`);
                setError(`Falscher PIN Code. (${remaining} Versuche übrig)`);
            }
        } catch (error) {
            console.error("Error verifying PIN:", error);
            setError(`Ein Fehler ist aufgetreten. Bitte versuche es später.`);
        }
    };

    return {
        gift,
        loading,
        error,
        setError,
        unlocked,
        isTimeLocked,
        unlockTime,
        verifyPin,
        triggerAnimation,
    };
}
