import React, { useState, useEffect } from 'react';
import { GeoLocation, AdSubmission } from '../types';
import { LocationMultiSelect } from './LocationMultiSelect';
import { AddressAutocomplete } from './AddressAutocomplete';
import { calculatePricing } from '../utils/pricing';
import { createCheckoutSession } from '../services/stripeService';
import { supabase } from '../utils/supabaseClient';

import { X, Upload, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';

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
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedLocations([currentLocation]);
            setCategory('');
            setContent('');
            setEmail('');
            setPhone('');
            setAddress('');
            setFile(null);
            setErrors({});
            setShowConfirmation(false);
        }
    }, [isOpen, currentLocation]);

    // Calculate pricing
    const pricing = calculatePricing(selectedLocations.length);

    // Character count
    const characterCount = content.length;
    const maxCharacters = 140;

    // Email validation helper
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

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

        if (!email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate size (2MB)
            if (selectedFile.size > 2 * 1024 * 1024) {
                setErrors({ ...errors, file: 'File size must be less than 2MB' });
                return;
            }

            // Validate type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!validTypes.includes(selectedFile.type)) {
                setErrors({ ...errors, file: 'Only JPG, PNG, WEBP images and PDF documents are allowed' });
                return;
            }

            setFile(selectedFile);
            // Clear file error if any
            const newErrors = { ...errors };
            delete newErrors.file;
            setErrors(newErrors);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            let attachmentUrl = undefined;
            let attachmentType: 'image' | 'document' | undefined = undefined;

            // Upload file if selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('ad-attachments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('ad-attachments')
                    .getPublicUrl(filePath);

                attachmentUrl = publicUrl;
                attachmentType = file.type.startsWith('image/') ? 'image' : 'document';
            }

            const adData: AdSubmission = {
                locations: selectedLocations,
                category,
                content,
                email,
                phone,
                address,
                contact: email, // Backward compatibility
                subtotal: pricing.subtotal,
                tax: pricing.tax,
                totalAmount: pricing.total,
                attachment_url: attachmentUrl,
                attachment_type: attachmentType
            };

            // Create Stripe checkout session
            const session = await createCheckoutSession(adData);

            // Redirect to Stripe Checkout
            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error submitting ad:', error);
            setErrors({ submit: error.message || 'Failed to process payment. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Confirmation view
    if (showConfirmation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
                <div className="bg-[#FDFBF7] border-2 sm:border-4 border-black max-w-2xl w-full p-4 sm:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 hover:bg-black hover:text-white transition-colors border-2 border-black touch-manipulation"
                        aria-label="Close"
                    >
                        <X size={20} className="sm:hidden" />
                        <X size={24} className="hidden sm:block" />
                    </button>

                    <div className="text-center space-y-4 sm:space-y-6">
                        <div className="text-4xl sm:text-6xl">✓</div>
                        <h2 className="text-2xl sm:text-4xl font-bold">Thank You for Your Submission!</h2>

                        <div className="border-l-4 border-[#006464] pl-4 sm:pl-6 text-left space-y-2 sm:space-y-3 text-sm sm:text-lg">
                            <p className="font-bold">Your post is subject to moderation.</p>
                            <p>Please allow <strong>2 hours</strong> for your post to go live.</p>
                            <p>If your post is rejected, you will receive a <strong>100% refund</strong> to your payment method.</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="bg-[#006464] text-white px-6 sm:px-8 py-3 text-lg sm:text-xl font-bold hover:bg-[#004444] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] touch-manipulation w-full sm:w-auto"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto">
            <div className="bg-[#FDFBF7] border-2 sm:border-4 border-black max-w-4xl w-full my-2 sm:my-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                {/* Header */}
                <div className="border-b-2 sm:border-b-4 border-black p-4 sm:p-6 bg-white relative">
                    <h2 className="text-2xl sm:text-4xl font-bold text-center pr-10 sm:pr-0">Post an Ad</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-2 hover:bg-black hover:text-white transition-colors border-2 border-black touch-manipulation"
                        aria-label="Close"
                    >
                        <X size={20} className="sm:hidden" />
                        <X size={24} className="hidden sm:block" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-8">
                    {/* Location Selection */}
                    <div>
                        <label className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Select Locations
                        </label>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 italic">
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
                    <div className="border-2 sm:border-4 border-[#006464] p-4 sm:p-6 bg-white">
                        <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 uppercase tracking-wider">Pricing</h3>
                        <div className="space-y-2 text-base sm:text-lg">
                            <div className="flex justify-between">
                                <span className="text-sm sm:text-base">Subtotal ({pricing.countyCount} {pricing.countyCount === 1 ? 'county' : 'counties'} × $5.00):</span>
                                <span className="font-bold">{pricing.formatted.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span className="text-sm sm:text-base">Tax (6%):</span>
                                <span className="font-bold">{pricing.formatted.tax}</span>
                            </div>
                            <div className="border-t-2 border-black pt-2 flex justify-between text-xl sm:text-2xl font-bold">
                                <span>Total:</span>
                                <span className="text-[#006464]">{pricing.formatted.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label htmlFor="category" className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Category
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border-2 border-black px-3 sm:px-4 py-3 sm:py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#006464] touch-manipulation"
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
                        <label htmlFor="content" className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Ad Content
                        </label>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 italic border-l-4 border-[#006464] pl-3 sm:pl-4">
                            Ads are text-only and limited to 140 characters.
                        </p>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            maxLength={maxCharacters}
                            rows={4}
                            className="w-full border-2 border-black px-3 sm:px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#006464] resize-none touch-manipulation"
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

                    {/* File Attachment (Optional) */}
                    <div>
                        <label className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Attachment <span className="text-gray-500 text-sm">(Optional)</span>
                        </label>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 italic">
                            Add an image or document to your ad (Max 2MB).
                        </p>

                        {!file ? (
                            <div className="relative border-2 border-dashed border-gray-400 rounded-lg p-6 hover:border-[#006464] transition-colors bg-gray-50">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <Upload size={32} className="mb-2" />
                                    <span className="font-bold">Click to upload or drag and drop</span>
                                    <span className="text-xs mt-1">JPG, PNG, WEBP, PDF</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between border-2 border-[#006464] bg-[#F0FDFD] p-4 rounded-lg">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {file.type.startsWith('image/') ? (
                                        <ImageIcon size={24} className="text-[#006464] flex-shrink-0" />
                                    ) : (
                                        <FileText size={24} className="text-[#006464] flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    aria-label="Remove file"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        )}
                        {errors.file && (
                            <p className="text-red-600 font-bold mt-2">{errors.file}</p>
                        )}
                    </div>

                    {/* Email Address (Required) */}
                    <div>
                        <label htmlFor="email" className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Email Address <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-2 border-black px-3 sm:px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#006464] touch-manipulation"
                            placeholder="your@email.com"
                            required
                        />
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 italic">You'll receive a confirmation email after submission</p>
                        {errors.email && (
                            <p className="text-red-600 font-bold mt-2">{errors.email}</p>
                        )}
                    </div>

                    {/* Phone Number (Optional) */}
                    <div>
                        <label htmlFor="phone" className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Phone Number <span className="text-gray-500 text-sm">(Optional)</span>
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border-2 border-black px-3 sm:px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#006464] touch-manipulation"
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    {/* Physical Address (Optional with Autocomplete) */}
                    <div>
                        <label htmlFor="address" className="block text-lg sm:text-xl font-bold mb-2 sm:mb-3 uppercase tracking-wider">
                            Physical Address <span className="text-gray-500 text-sm">(Optional)</span>
                        </label>
                        <AddressAutocomplete
                            value={address}
                            onChange={setAddress}
                            placeholder="Start typing your address..."
                            className="w-full border-2 border-black px-3 sm:px-4 py-3 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#006464] touch-manipulation"
                        />
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="border-2 border-red-600 bg-red-50 p-4">
                            <p className="text-red-600 font-bold">{errors.submit}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-2 sm:pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#006464] text-white px-6 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold hover:bg-[#004444] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation w-full sm:w-auto"
                        >
                            {isSubmitting ? 'Processing...' : `Proceed to Payment (${pricing.formatted.total})`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
