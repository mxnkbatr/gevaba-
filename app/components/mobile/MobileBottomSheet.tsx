"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlatform } from '@/app/capacitor/hooks/usePlatform';
import { X } from 'lucide-react';
import { hapticsLight, hapticsMedium } from '@/app/capacitor/plugins/haptics';

export interface MobileBottomSheetProps {
    /** Whether the sheet is open */
    isOpen: boolean;
    /** Callback when sheet should close */
    onClose: () => void;
    /** Sheet title */
    title?: string;
    /** Sheet content */
    children: ReactNode;
    /** Custom className */
    className?: string;
    /** Disable swipe-to-dismiss */
    disableSwipe?: boolean;
}

/**
 * Platform-aware bottom sheet/modal component.
 * 
 * Features:
 * - iOS: Native bottom sheet with drag handle
 * - Android: Material Design bottom sheet
 * - Swipe-to-dismiss gesture
 * - Backdrop blur
 * - Haptic feedback
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <MobileBottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Booking Details"
 * >
 *   <BookingForm />
 * </MobileBottomSheet>
 * ```
 */
export default function MobileBottomSheet({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    disableSwipe = false,
}: MobileBottomSheetProps) {
    const { isIOS, isAndroid, safeArea } = usePlatform();
    const [dragY, setDragY] = useState(0);

    useEffect(() => {
        // Prevent body scroll when sheet is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleDragEnd = (_event: any, info: any) => {
        if (disableSwipe) return;

        // Close if dragged down more than 150px
        if (info.offset.y > 150) {
            hapticsLight();
            onClose();
        }
        setDragY(0);
    };

    const handleBackdropClick = () => {
        hapticsMedium();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={handleBackdropClick}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                        }}
                        drag={!disableSwipe ? 'y' : false}
                        dragConstraints={{ top: 0, bottom: 500 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        onDrag={(_event, info) => setDragY(info.offset.y)}
                        className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white
              ${isIOS ? 'rounded-t-3xl' : 'rounded-t-2xl'}
              shadow-2xl
              max-h-[90vh]
              overflow-hidden
              ${className}
            `}
                        style={{
                            paddingBottom: safeArea.bottom,
                        }}
                    >
                        {/* Drag Handle (iOS style) */}
                        {isIOS && !disableSwipe && (
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 bg-text-muted/30 rounded-full" />
                            </div>
                        )}

                        {/* Header */}
                        {title && (
                            <div className={`
                flex items-center justify-between px-6
                ${isIOS ? 'py-3' : 'py-4'}
                border-b border-black/[0.06]
              `}>
                                <h3 className="text-lg font-bold text-ink">{title}</h3>
                                <button
                                    onClick={() => {
                                        hapticsMedium();
                                        onClose();
                                    }}
                                    className="p-2 hover:bg-black/[0.04] rounded-full transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={20} className="text-earth/60" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[70vh] px-6 py-4">
                            {children}
                        </div>

                        {/* Android FAB space (if needed) */}
                        {isAndroid && <div className="h-4" />}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
