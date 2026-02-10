"use client";

import type { Organization } from "@/types/organization";
import {
    CreditCard,
    Calendar,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowUpCircle,
    FileText,
} from "lucide-react";

interface SubscriptionInfoProps {
    organization: Organization;
}

export default function SubscriptionInfo({
    organization,
}: SubscriptionInfoProps) {
    const subscription = organization.subscription;

    if (!subscription) {
        return (
            <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No subscription information available</p>
            </div>
        );
    }

    const isTrial = organization.status === "TRIAL";
    const isActive = subscription.paymentStatus === "ACTIVE";
    const isPastDue = subscription.paymentStatus === "PAST_DUE";

    const getStatusColor = () => {
        if (isPastDue) return "text-red-600";
        if (isTrial) return "text-blue-600";
        if (isActive) return "text-green-600";
        return "text-gray-600";
    };

    const getStatusIcon = () => {
        if (isPastDue) return <AlertCircle className="h-5 w-5" />;
        if (isTrial) return <Clock className="h-5 w-5" />;
        if (isActive) return <CheckCircle className="h-5 w-5" />;
        return <AlertCircle className="h-5 w-5" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900">
                    Subscription & Billing
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Manage your subscription and billing details
                </p>
            </div>

            {/* Status Alert */}
            {isTrial && subscription.trialEndDate && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">
                                Trial Period Active
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Your trial ends on {formatDate(subscription.trialEndDate)} (
                                {getDaysRemaining(subscription.trialEndDate)} days remaining)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isPastDue && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">
                                Payment Past Due
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                                Please update your payment method to continue using the service.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Plan */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-2xl font-bold text-gray-900">
                            {subscription.planType} Plan
                        </h4>
                        <div className={`flex items-center gap-2 mt-2 ${getStatusColor()}`}>
                            {getStatusIcon()}
                            <span className="text-sm font-medium">
                                {subscription.paymentStatus}
                            </span>
                        </div>
                    </div>
                    {subscription.monthlyPrice !== undefined && subscription.monthlyPrice !== null && (
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">
                                ${subscription.monthlyPrice}
                            </div>
                            <div className="text-sm text-gray-600">
                                / {subscription.billingCycle.toLowerCase()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Calendar className="h-5 w-5" />
                        <span className="text-sm font-medium">Start Date</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                        {formatDate(subscription.startDate)}
                    </p>
                </div>

                {subscription.endDate && (
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Calendar className="h-5 w-5" />
                            <span className="text-sm font-medium">End Date</span>
                        </div>
                        <p className="text-gray-900 font-medium">
                            {formatDate(subscription.endDate)}
                        </p>
                    </div>
                )}

                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm font-medium">Billing Cycle</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                        {subscription.billingCycle}
                    </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <DollarSign className="h-5 w-5" />
                        <span className="text-sm font-medium">Payment Status</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                        {subscription.paymentStatus}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <ArrowUpCircle className="h-4 w-4" />
                    Upgrade Plan
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <CreditCard className="h-4 w-4" />
                    Update Payment Method
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <FileText className="h-4 w-4" />
                    View Invoices
                </button>
            </div>

            {/* Disclaimer */}
            {subscription.endDate && (
                <div className="text-xs text-gray-500 text-center pt-4 border-t">
                    Your subscription will automatically renew on{" "}
                    {formatDate(subscription.endDate)}. You can cancel anytime from your account settings.
                </div>
            )}
        </div>
    );
}
