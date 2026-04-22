"use client";

import { useState } from "react";
import { attendanceApi, CheckOutRequest } from "@/lib/api/attendance";
import { getCurrentPosition, getDeviceInfo } from "@/lib/utils/geolocation";
import { toast } from "react-hot-toast";

interface CheckOutButtonProps {
  attendanceId: string;
  onSuccess?: () => void;
}

export function CheckOutButton({ attendanceId, onSuccess }: CheckOutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckOut = async () => {
    setLoading(true);

    try {
      // Get geolocation
      const position = await getCurrentPosition();

      const request: CheckOutRequest = {
        // attendanceId is optional now - backend uses userId + date instead
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        deviceInfo: getDeviceInfo(),
      };

      await attendanceApi.checkOut(request);
      toast.success("✅ Checked out successfully!");
      onSuccess?.();
    } catch (error: any) {
      console.error("Check-out error:", error);

      if (error.message?.includes("permission")) {
        toast.error("📍 Please enable location access to check out");
      } else {
        toast.error("Failed to check out. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckOut}
      disabled={loading}
      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400
                 text-white font-semibold rounded-xl text-lg transition-colors
                 flex items-center justify-center gap-2 shadow-lg"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Getting Location...
        </>
      ) : (
        <>🏁 Check Out</>
      )}
    </button>
  );
}
