import React, { useState, useEffect } from 'react';
import { GeoLocation, AdSubmission } from '../types';
import { LocationMultiSelect } from './LocationMultiSelect';
import { calculatePricing } from '../utils/pricing';
import { createCheckoutSession } from '../services/stripeService';
import { X } from 'lucide-react';

interface PostAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLocation: GeoLocation;
}

const AD_CATEGORIES = [
    'FOR SALE',
    'SERVICE',
    'WANTED',
    'COMMUNITY',
    'FARM',
    'LOST',
    'HELP WANTED',
    'FREE',
    'EVENT',
    'OTHER'
];

export const PostAdModal: React.FC<PostAdModalProps> = ({
    isOpen,
    onClose,
    currentLocation
}) => {
    const [selectedLocations, setSelectedLocations] = useState<GeoLocation[]>([currentLocation]);
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedLocations([currentLocation]);
            setCategory('');
            setContent('');
            setContact('');
            setErrors({});
            setShowConfirmation(false);
        }
    }, [isOpen, currentLocation]);

    // Calculate pricing
    const pricing = calculatePricing(selectedLocations.length);

    // Character count
    const characterCount = content.length;
    const maxCharacters = 140;

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (selectedLocations.length === 0) {
            newErrors.locations = 'Please select at least one location';
        }

        if (!category) {
            newErrors.category = 'Please select a category';
        }

        if (!content.trim()) {
            newErrors.content = 'Please enter ad content';
        } else if (content.length > maxCharacters) {
            newErrors.content = `Content must be ${maxCharacters} characters or less`;
        }

        if (!contact.trim()) {
            newErrors.contact = 'Please enter contact information';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const adData: AdSubmission = {
                locations: selectedLocations,
                category,
                content,
                contact,
                subtotal: pricing.subtotal,
                tax: pricing.tax,
                totalAmount: pricing.total
            };

            // Create Stripe checkout session
            const session = await createCheckoutSession(adData);

            // In production, redirect to Stripe Checkout
            // window.location.href = session.url;

            // For now, show confirmation (mock flow)
            console.log('Checkout session created:', session);
            setShowConfirmation(true);
        } catch (error) {
            console.error('Error submitting ad:', error);
            setErrors({ submit: 'Failed to process payment. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Confirmation view
    if (showConfirmation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-[#FDFBF7] border-4 border-black max-w-2xl w-full p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center space-y-6">
                        <div className="text-6xl">✓</div>
                        <h2 className="text-4xl font-bold">Thank You for Your Submission!</h2>

                        <div className="border-l-4 border-[#006464] pl-6 text-left space-y-3 text-lg">
                            <p className="font-bold">Your post is subject to moderation.</p>
                            <p>Please allow <strong>2 hours</strong> for your post to go live.</p>
                            <p>If your post is rejected, you will receive a <strong>100% refund</strong> to your payment method.</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="bg-[#006464] text-white px-8 py-3 text-xl font-bold hover:bg-[#004444] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main form view
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-[#FDFBF7] border-4 border-black max-w-4xl w-full my-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                {/* Header */}
                <div className="border-b-4 border-black p-6 bg-white relative">
                    <h2 className="text-4xl font-bold text-center">Post an Ad</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Location Selection */}
                    <div>
                        <label className="block text-xl font-bold mb-3 uppercase tracking-wider">
                            Select Locations
                        </label>
                        <p className="text-sm text-gray-600 mb-4 italic">
                            Your ad will appear in all selected counties. Each county costs $5.00.
                        </p>
                        <LocationMultiSelect
                            selectedLocations={selectedLocations}
                            onChange={setSelectedLocations}
                        />
                        {errors.locations && (
                            <p className="text-red-600 font-bold mt-2">{errors.locations}</p>
                        )}
                    </div>

                    {/* Pricing Display */}
                    <div className="border-4 border-[#006464] p-6 bg-white">
                        <h3 className="text-2xl font-bold mb-4 uppercase tracking-wider">Pricing</h3>
                        <div className="space-y-2 text-lg">
                            <div className="flex justify-between">
                                <span>Subtotal ({pricing.countyCount} {pricing.countyCount === 1 ? 'county' : 'counties'} × $5.00):</span>
                                <span className="font-bold">{pricing.formatted.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (6%):</span>
                                <span className="font-bold">{pricing.formatted.tax}</span>
                            </div>
                            <div className="border-t-2 border-black pt-2 flex justify-between text-2xl font-bold">
                                <span>Total:</span>
                                <span className="text-[#006464]">{pricing.formatted.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label htmlFor="category" className="block text-xl font-bold mb-3 uppercase tracking-wider">
                            Category
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#006464]"
                        >
                            <option value="">Select a category...</option>
                            {AD_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-red-600 font-bold mt-2">{errors.category}</p>
                        )}
                    </div>

                    {/* Ad Content */}
                    <div>
                        <label htmlFor="content" className="block text-xl font-bold mb-3 uppercase tracking-wider">
                            Ad Content
                        </label>
                        <p className="text-sm text-gray-600 mb-3 italic border-l-4 border-[#006464] pl-4">
                            Ads are text-only and limited to 140 characters.
                        </p>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            maxLength={maxCharacters}
                            rows={4}
                            className="w-full border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#006464] resize-none"
                            placeholder="Enter your ad text here..."
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className={`text-sm font-bold ${characterCount > maxCharacters ? 'text-red-600' : 'text-gray-600'}`}>
                                {characterCount}/{maxCharacters} characters
                            </span>
                        </div>
                        {errors.content && (
                            <p className="text-red-600 font-bold mt-2">{errors.content}</p>
                        )}
                    </div>

                    {/* Contact Information */}
                    <div>
                        <label htmlFor="contact" className="block text-xl font-bold mb-3 uppercase tracking-wider">
                            Contact Information
                        </label>
                        <input
                            type="text"
                            id="contact"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="w-full border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#006464]"
                            placeholder="Phone, email, or address..."
                        />
                        {errors.contact && (
                            <p className="text-red-600 font-bold mt-2">{errors.contact}</p>
                        )}
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="border-2 border-red-600 bg-red-50 p-4">
                            <p className="text-red-600 font-bold">{errors.submit}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#006464] text-white px-12 py-4 text-2xl font-bold hover:bg-[#004444] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Processing...' : `Proceed to Payment (${pricing.formatted.total})`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
