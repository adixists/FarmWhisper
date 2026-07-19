import { useState, useEffect } from 'react';
import { ThumbsUp, Share2, MessageCircle, Filter } from 'lucide-react';
import { getCommunityPosts } from '../services/api';

type CropType = 'all' | 'wheat' | 'rice' | 'sugarcane';

interface Post {
  id: string;
  author: string;
  avatar: string;
  title: string;
  description: string;
  crop: string;
  likes: number;
  comments: number;
  time: string;
}

// Convert backend post format to frontend format
const convertPostFormat = (backendPost: any): Post => {
  return {
    id: backendPost.id,
    author: backendPost.user_id === "user1" ? "रामप्रसाद शर्मा" : 
            backendPost.user_id === "user2" ? "सुरेश पटेल" : 
            backendPost.user_id === "user3" ? "गीता देवी" : "किसान समुदाय",
    avatar: backendPost.user_id === "user1" ? "👴" : 
            backendPost.user_id === "user2" ? "🧑‍🌾" : 
            backendPost.user_id === "user3" ? "👩‍🌾" : "🤝",
    title: backendPost.title,
    description: backendPost.content,
    crop: backendPost.tags && backendPost.tags.length > 0 ? 
          backendPost.tags[0] === "traditional knowledge" ? "सभी फसल" :
          backendPost.tags[0] === "pest control" ? "गेहूं" :
          backendPost.tags[0] === "soil health" ? "धान" : "सभी फसल" : "सभी फसल",
    likes: backendPost.upvotes || Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 50),
    time: "अभी-अभी"
  };
};

export function CommunityScreen() {
  const [filter, setFilter] = useState<CropType>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts from backend when component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Try to fetch posts from backend
        const backendPosts = await getCommunityPosts(10, 0);
        
        // Convert backend posts to frontend format
        let convertedPosts: Post[] = [];
        if (Array.isArray(backendPosts)) {
          convertedPosts = backendPosts.map(convertPostFormat);
        } else {
          // If we get a single post or unexpected format, use sample posts
          convertedPosts = [
            {
              id: "1",
              author: 'रामप्रसाद शर्मा',
              avatar: '👴',
              title: 'दादी माँ की बारिश की रस्म',
              description: 'मेरी दादी हमेशा कहती थीं - बारिश से पहले खेत में तुलसी के पत्ते फैलाओ। फसल को रोग नहीं लगता।',
              crop: 'सभी फसल',
              likes: 243,
              comments: 34,
              time: '2 घंटे पहले',
            },
            {
              id: "2",
              author: 'सुरेश पटेल',
              avatar: '🧑‍🌾',
              title: 'कीटों को भगाने का देसी नुस्खा',
              description: 'नीम के पत्ते + लहसुन का रस + पानी। इसे स्प्रे करने से सभी कीट भाग जाते हैं। कोई केमिकल नहीं चाहिए!',
              crop: 'गेहूं',
              likes: 189,
              comments: 45,
              time: '5 घंटे पहले',
            },
            {
              id: "3",
              author: 'गीता देवी',
              avatar: '👩‍🌾',
              title: 'धान के लिए गाय के गोबर का पानी',
              description: 'गोबर को पानी में घोलकर 3 दिन रखो। फिर धान में डालो। पौधे हरे-भरे हो जाते हैं। 100% प्राकृतिक।',
              crop: 'धान',
              likes: 312,
              comments: 67,
              time: '1 दिन पहले',
            }
          ];
        }
        
        setPosts(convertedPosts);
      } catch (err) {
        // If backend fails, use sample posts
        console.error('Error fetching posts from backend:', err);
        setError('Failed to fetch posts from backend. Showing sample data.');
        setPosts([
          {
            id: "1",
            author: 'रामप्रसाद शर्मा',
            avatar: '👴',
            title: 'दादी माँ की बारिश की रस्म',
            description: 'मेरी दादी हमेशा कहती थीं - बारिश से पहले खेत में तुलसी के पत्ते फैलाओ। फसल को रोग नहीं लगता।',
            crop: 'सभी फसल',
            likes: 243,
            comments: 34,
            time: '2 घंटे पहले',
          },
          {
            id: "2",
            author: 'सुरेश पटेल',
            avatar: '🧑‍🌾',
            title: 'कीटों को भगाने का देसी नुस्खा',
            description: 'नीम के पत्ते + लहसुन का रस + पानी। इसे स्प्रे करने से सभी कीट भाग जाते हैं। कोई केमिकल नहीं चाहिए!',
            crop: 'गेहूं',
            likes: 189,
            comments: 45,
            time: '5 घंटे पहले',
          },
          {
            id: "3",
            author: 'गीता देवी',
            avatar: '👩‍🌾',
            title: 'धान के लिए गाय के गोबर का पानी',
            description: 'गोबर को पानी में घोलकर 3 दिन रखो। फिर धान में डालो। पौधे हरे-भरे हो जाते हैं। 100% प्राकृतिक।',
            crop: 'धान',
            likes: 312,
            comments: 67,
            time: '1 दिन पहले',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(post => post.crop.includes(
        filter === 'wheat' ? 'गेहूं' : 
        filter === 'rice' ? 'धान' : 
        filter === 'sugarcane' ? 'गन्ना' : ''
      ) || post.crop === 'सभी फसल');

  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="text-center mb-4 pt-2">
          <div className="text-4xl mb-2">🤝</div>
          <h2 className="text-white mb-1">किसान समुदाय</h2>
          <p className="text-green-100 text-sm">स्थानीय ज्ञान साझा करें</p>
        </div>

        {/* Status indicator */}
        {loading && (
          <div className="text-center mb-2 text-green-200">
            Loading posts...
          </div>
        )}
        
        {error && (
          <div className="text-center mb-2 text-amber-200 bg-amber-500/20 p-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-amber-400 text-amber-900'
                : 'bg-green-600 text-green-100'
            }`}
          >
            🌾 सभी
          </button>
          <button
            onClick={() => setFilter('wheat')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'wheat'
                ? 'bg-amber-400 text-amber-900'
                : 'bg-green-600 text-green-100'
            }`}
          >
            🌾 गेहूं
          </button>
          <button
            onClick={() => setFilter('rice')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'rice'
                ? 'bg-amber-400 text-amber-900'
                : 'bg-green-600 text-green-100'
            }`}
          >
            🍚 धान
          </button>
          <button
            onClick={() => setFilter('sugarcane')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === 'sugarcane'
                ? 'bg-amber-400 text-amber-900'
                : 'bg-green-600 text-green-100'
            }`}
          >
            🎋 गन्ना
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4 pb-20">
        {posts.length > 0 ? (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-3xl shadow-lg p-5 border-2 border-amber-200 hover:border-green-300 transition-colors"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-2xl">
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-green-900">{post.author}</p>
                  <p className="text-green-600 text-sm">{post.time}</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                  {post.crop}
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h4 className="text-green-900 mb-2">{post.title}</h4>
                <p className="text-green-700 text-sm leading-relaxed">
                  {post.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-green-100">
                <button className="flex items-center gap-2 text-green-700 hover:text-green-900 transition-colors">
                  <ThumbsUp className="w-5 h-5" />
                  <span className="text-sm">{post.likes}</span>
                </button>
                
                <button className="flex items-center gap-2 text-green-700 hover:text-green-900 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments}</span>
                </button>
                
                <button className="flex items-center gap-2 text-green-700 hover:text-green-900 transition-colors ml-auto">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">शेयर</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-green-700 py-8">
            No posts available
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50">
        <span className="text-2xl">➕</span>
      </button>
    </div>
  );
}