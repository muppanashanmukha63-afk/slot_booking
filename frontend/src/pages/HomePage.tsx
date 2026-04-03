import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

// ✅ Define Experience type
interface Experience {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image_url: string;
  created_at: string;
}

interface HomePageProps {
  onViewDetails: (experience: Experience) => void;
}

export default function HomePage({ onViewDetails }: HomePageProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data from your backend or mock JSON
  useEffect(() => {
    fetchExperiences();
  }, []);

  // Filter results based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExperiences(experiences);
    } else {
      const filtered = experiences.filter(exp =>
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExperiences(filtered);
    }
  }, [searchQuery, experiences]);

  // Fetch experiences (Replace URL with your backend endpoint)
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/experiences'); // 👈 Replace this with your backend route
      const data = await response.json();
      setExperiences(data);
      setFilteredExperiences(data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">hd</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold leading-none">highway</span>
                <span className="text-base font-semibold leading-none">delite</span>
              </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl flex gap-2">
              <input
                type="text"
                placeholder="Search experiences"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Search size={18} />
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredExperiences.length === 0 ? (
          // No results
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No experiences found</p>
          </div>
        ) : (
          // Experience grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredExperiences.map((experience) => (
              <div
                key={experience.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={experience.image_url || '/placeholder.jpg'}
                    alt={experience.title}
                    className="w-full h-48 object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{experience.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap ml-2">
                      {experience.location}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {experience.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">From </span>
                      <span className="text-lg font-bold text-gray-900">₹{experience.price}</span>
                    </div>
                    <button
                      onClick={() => onViewDetails(experience)}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
