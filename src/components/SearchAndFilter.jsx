"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SearchAndFilter = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    priceRange: [0, 1000],
    rating: "",
  });
  const [category, setCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  const qatarCities = [
    "Doha",
    "Al Wakrah",
    "Al Khor",
    "Al Rayyan",
    "Umm Salal",
    "Al Daayen",
    "Lusail",
    "Mesaieed",
    "Dukhan",
    "Al Shamal",
    "Al Ruwais",
  ];

  // Reusable function to build query and navigate
  const triggerSearch = () => {
    // Build query parameters
    const queryParams = new URLSearchParams({
      query: searchQuery,
      location: filters.location || "",
      minPrice: filters.priceRange[0].toString(),
      maxPrice: filters.priceRange[1].toString(),
      rating: filters.rating || "",
      category,
    });

    // Redirect to the search results page
    router.push(`/search?${queryParams.toString()}`);
  };

  const handleSearch = () => {
    if (!searchQuery.trim() && category === "all") {
      alert("Please enter a search term or select a category.");
      return;
    }

    setShowFilters(false);
    triggerSearch();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update category and trigger search immediately
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setShowFilters(true); // Keep filters open for further refinements
    triggerSearch(); // Trigger search immediately on category change
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const categories = [
    "all",
    "restaurant",
    "hall",
    "activity",
    "salon",
    "hotel",
    "gym",
    "playground",
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={filterRef}>
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search for services or items..."
          className="w-full p-2 border rounded-lg shadow-sm h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowFilters(true)}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className="absolute top-16 left-0 w-full bg-white shadow-lg p-4 rounded-lg z-10"
          tabIndex={-1}
        >
          {/* Location Filter */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">Location</label>
            <select
              name="location"
              className="w-full p-2 border rounded-lg"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="">Select a city in Qatar</option>
              {qatarCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    category === cat ? "bg-black text-white" : "bg-gray-200"
                  }`}
                  onClick={() => handleCategoryChange(cat)} // Updated to use new handler
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">Price Range</label>
            <div className="flex space-x-2 items-center">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                className="w-1/2 p-2 border rounded-lg"
                value={filters.priceRange[0]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [+e.target.value, prev.priceRange[1]],
                  }))
                }
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                className="w-1/2 p-2 border rounded-lg"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], +e.target.value],
                  }))
                }
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">Rating</label>
            <select
              name="rating"
              className="w-full p-2 border rounded-lg"
              value={filters.rating}
              onChange={handleFilterChange}
            >
              <option value="">Select rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="mt-4">
            <button
              className="px-6 py-3 bg-black text-white rounded-lg w-full"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter; 