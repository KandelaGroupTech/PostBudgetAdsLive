import React from 'react';
import { X, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
            <div className="bg-[#FDFBF7] border-4 border-black max-w-2xl w-full p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-slideUp">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <div className="text-center space-y-6">
                    {/* Success Icon */}
                    <div className="flex justify-center">
                        <div className="bg-green-100 border-4 border-green-600 rounded-full p-4">
                            <CheckCircle size={64} className="text-green-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-4xl font-bold uppercase tracking-wider">
                        Thank You for Your Submission!
                    </h2>

                    {/* Message */}
                    <div className="border-l-4 border-[#006464] pl-6 text-left space-y-3 text-lg bg-white p-6">
                        <p className="font-bold text-xl">Your ad is subject to moderation.</p>
                        <p>
                            Please allow <strong className="text-[#006464]">up to 2 hours</strong> for your ad to be reviewed and go live.
                        </p>
                        <p>
                            If your ad is rejected for any reason, you will receive a{' '}
                            <strong className="text-[#006464]">100% refund</strong> to your payment method.
                        </p>
                        <p className="text-base text-gray-600 italic mt-4">
                            You'll receive an email confirmation shortly with more details.
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="bg-[#006464] text-white px-12 py-4 text-2xl font-bold hover:bg-[#004444] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full sm:w-auto"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
};
