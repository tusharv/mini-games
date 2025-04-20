'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Game {
  slug: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  status?: string;
  mobileStatus?: string;
}

interface GamesSectionProps {
  games: Game[];
}

export default function GamesSection({ games }: GamesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get unique tags from all games
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    games.forEach(game => {
      game.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [games]);

  // Filter games based on search query and selected tags
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = 
        searchQuery === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTags = 
        selectedTags.length === 0 ||
        selectedTags.every(tag => game.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [games, searchQuery, selectedTags]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <section 
      id="games" 
      className="container mx-auto px-4 py-16"
    >
      <h2 className="text-4xl font-black text-center mb-12 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
        Pick Your Game!
      </h2>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-6">
        {/* Search Input */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search games by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/20 
            text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/50
            backdrop-blur-sm"
          />
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                ${selectedTags.includes(tag)
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }
                border border-white/20 backdrop-blur-sm`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <Link 
              key={game.slug}
              href={`/games/${game.slug}`}
              className="group block p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg 
              hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-white/20"
            >
              <div className="text-5xl mb-4">{game.icon}</div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white group-hover:text-yellow-300 transition">{game.title}</h2>
                {game.status === 'beta' && (
                  <span className="px-2 py-1 text-xs font-bold bg-yellow-400 text-black rounded-full">
                    Beta
                  </span>
                )}
              </div>
              <p className="text-white/80 text-lg mb-4">{game.description}</p>
              {game.mobileStatus === 'coming-soon' && (
                <p className="text-yellow-400 text-sm mb-4">📱 Mobile view coming soon!</p>
              )}
              <div className="flex flex-wrap gap-2 mb-6">
                {game.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-400/30 to-pink-400/30 
                    border border-white/20 rounded-full text-sm font-medium text-white 
                    hover:from-purple-400/40 hover:to-pink-400/40 transition-all duration-300
                    shadow-sm backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="inline-block px-6 py-3 bg-yellow-400 text-black rounded-full font-bold 
              group-hover:bg-yellow-300 transform group-hover:scale-105 transition-all duration-300">
                Play Now! 🎮
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-white/80 text-xl">
              No games found matching your search criteria. Try adjusting your filters!
            </p>
          </div>
        )}
      </div>
    </section>
  );
} 
