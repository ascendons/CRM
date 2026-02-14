import React, { useState } from 'react';

interface NegotiationStartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading?: boolean;
}

export const NegotiationStartModal: React.FC<NegotiationStartModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Start Negotiation
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Please provide the customer's feedback or reason for negotiation:
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g. Customer wants 10% discount..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={() => {
                            setReason("");
                            onClose();
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={isLoading || !reason.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isLoading ? "Starting..." : "Start Negotiation"}
                    </button>
                </div>
            </div>
        </div>
    );
};
