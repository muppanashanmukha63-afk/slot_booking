import { CheckCircle, XCircle } from 'lucide-react';

interface ResultPageProps {
  success: boolean;
  referenceId?: string;
  onBackToHome: () => void;
}

export default function ResultPage({ success, referenceId, onBackToHome }: ResultPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {success ? (
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-white" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle size={48} className="text-white" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {success ? 'Booking Confirmed' : 'Booking Failed'}
        </h1>

        {success && referenceId && (
          <div className="mb-8">
            <p className="text-gray-600 mb-2">Ref ID:</p>
            <p className="text-xl font-semibold text-gray-900">{referenceId}</p>
          </div>
        )}

        {!success && (
          <p className="text-gray-600 mb-8">
            We couldn't process your booking. Please try again or contact support.
          </p>
        )}

        <button
          onClick={onBackToHome}
          className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
