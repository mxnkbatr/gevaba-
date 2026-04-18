'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePlatform } from '@/app/capacitor/hooks/usePlatform'
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen'

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(false)
    const { isNative } = usePlatform()

    useEffect(() => {
        const initSplash = async () => {
            if (isNative) {
                // Native platform: Handle via Capacitor completely, hide web splash
                try {
                    await CapSplashScreen.hide();
                } catch (e) {
                    console.warn("Capacitor Splash hide failed:", e);
                }
                setIsVisible(false);
                return;
            }

            const hasShown = sessionStorage.getItem('splashShown')
            if (hasShown) {
                setIsVisible(false)
                return
            }

            setIsVisible(true)
            const timer = setTimeout(() => {
                setIsVisible(false)
                sessionStorage.setItem('splashShown', 'true')
            }, 900)

            return () => clearTimeout(timer)
        }
        
        initSplash();
    }, [isNative])

    return (
        <AnimatePresence>
            {isVisible && !isNative && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                    }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#1A0F05' }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            transition: {
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                duration: 0.6
                            }
                        }}
                        className="relative w-32 h-32 md:w-40 md:h-40"
                    >
                        <Image
                            src="/logo.webp"
                            alt="Gevabal Logo"
                            fill
                            className="object-contain drop-shadow-2xl"
                            priority
                            loading="eager"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
