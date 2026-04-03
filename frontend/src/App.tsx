import { useState } from 'react';
import HomePage from './pages/HomePage';
import DetailsPage, { BookingData } from './pages/DetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import ResultPage from './pages/ResultPage';

type Page = 'home' | 'details' | 'checkout' | 'result';

interface Experience {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  // Add other fields you need from your backend
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [bookingResult, setBookingResult] = useState<{ success: boolean; referenceId?: string }>({
    success: false,
  });

  const handleViewDetails = (experience: Experience) => {
    setSelectedExperience(experience);
    setCurrentPage('details');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedExperience(null);
    setBookingData(null);
  };

  const handleBackToDetails = () => {
    setCurrentPage('details');
    setBookingData(null);
  };

  const handleCheckout = (data: BookingData) => {
    setBookingData(data);
    setCurrentPage('checkout');
  };

  const handleBookingSuccess = (referenceId: string) => {
    setBookingResult({ success: true, referenceId });
    setCurrentPage('result');
  };

  const handleBookingError = () => {
    setBookingResult({ success: false });
    setCurrentPage('result');
  };

  return (
    <>
      {currentPage === 'home' && (
        <HomePage onViewDetails={handleViewDetails} />
      )}

      {currentPage === 'details' && selectedExperience && (
        <DetailsPage
          experience={selectedExperience}
          onBack={handleBackToHome}
          onCheckout={handleCheckout}
        />
      )}

      {currentPage === 'checkout' && bookingData && (
        <CheckoutPage
          bookingData={bookingData}
          onBack={handleBackToDetails}
          onSuccess={handleBookingSuccess}
          onError={handleBookingError}
        />
      )}

      {currentPage === 'result' && (
        <ResultPage
          success={bookingResult.success}
          referenceId={bookingResult.referenceId}
          onBackToHome={handleBackToHome}
        />
      )}
    </>
  );
}

export default App;
