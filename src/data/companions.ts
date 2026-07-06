import { Companion, CompanionGender, CompanionStatus } from "../types";

export const INITIAL_COMPANIONS: Companion[] = [
  {
    id: "comp_1",
    name: "Alizeh Shah",
    age: 23,
    gender: CompanionGender.FEMALE,
    city: "Lahore",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    bio: "Hey there! I am Alizeh, a literature graduate from Lahore. I love deep conversations over a hot cup of Karak Chai, exploring old Lahore, and discussing poetry and psychology. I believe everyone deserves to be heard without judgment.",
    rating: 4.9,
    reviewsCount: 3,
    languages: ["Urdu", "English", "Punjabi"],
    interests: ["Reading", "Coffee", "Classical Music", "Psychology", "History"],
    services: ["dining", "call", "study", "day_spend"],
    status: CompanionStatus.APPROVED,
    isOnline: true,
    featured: true,
    pricingTier: "Gold",
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400"
    ]
  },
  {
    id: "comp_2",
    name: "Hamza Malik",
    age: 25,
    gender: CompanionGender.MALE,
    city: "Islamabad",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    bio: "Hi! I am Hamza, an outdoor enthusiast and movie buff based in Islamabad. Whether you want to hike up Margalla Hills, watch the latest sci-fi movie, or just talk about life, I am here to keep you company and make you smile.",
    rating: 4.8,
    reviewsCount: 3,
    languages: ["English", "Urdu", "Pashto"],
    interests: ["Hiking", "Sci-Fi Movies", "Photography", "Tech", "Fitness"],
    services: ["movie", "call", "day_spend", "travel"],
    status: CompanionStatus.APPROVED,
    isOnline: true,
    featured: true,
    pricingTier: "Platinum",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
    ]
  },
  {
    id: "comp_3",
    name: "Zara Ahmed",
    age: 22,
    gender: CompanionGender.FEMALE,
    city: "Karachi",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    bio: "Salam! I am Zara, a foodie and graphic designer from Karachi. I love tasting street food at Burns Road, walking along Clifton beach, and helping people study art history or design. I have an optimistic outlook and love spreading positive vibes.",
    rating: 4.7,
    reviewsCount: 3,
    languages: ["Urdu", "English", "Sindhi"],
    interests: ["Art & Design", "Street Food", "Beach Walks", "Pop Music", "Photography"],
    services: ["dining", "movie", "study", "call"],
    status: CompanionStatus.APPROVED,
    isOnline: false,
    featured: false,
    pricingTier: "Silver",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=400"
    ]
  },
  {
    id: "comp_4",
    name: "Aisha Khan",
    age: 24,
    gender: CompanionGender.FEMALE,
    city: "Islamabad",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    bio: "Hello, I am Aisha. I am an academic advisor and a nature lover. I enjoy quiet spaces, deep-dive study sessions, and slow evenings watching the sunset. I am a great listener and provide a peaceful, respectful environment.",
    rating: 5.0,
    reviewsCount: 3,
    languages: ["Urdu", "English"],
    interests: ["Academic Writing", "Nature Walks", "Gardening", "Tea Tasting", "Chess"],
    services: ["study", "call", "dining", "night_spend"],
    status: CompanionStatus.APPROVED,
    isOnline: true,
    featured: true,
    pricingTier: "Gold",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400"
    ]
  },
  {
    id: "comp_5",
    name: "Sameer Sheikh",
    age: 26,
    gender: CompanionGender.MALE,
    city: "Karachi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    bio: "Hey! I am Sameer, a business developer in Karachi. I offer dynamic companionship, especially for high-end dining, networking, or traveling. I have travelled extensively and enjoy talking about economics, global cultures, and cinema.",
    rating: 4.6,
    reviewsCount: 3,
    languages: ["English", "Urdu", "Punjabi"],
    interests: ["Travel", "Economics", "Fine Dining", "Golf", "Live Concerts"],
    services: ["dining", "travel", "call", "day_spend"],
    status: CompanionStatus.APPROVED,
    isOnline: false,
    featured: false,
    pricingTier: "Platinum",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400"
    ]
  },
  {
    id: "comp_6",
    name: "Fatima Jamil",
    age: 21,
    gender: CompanionGender.FEMALE,
    city: "Lahore",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400",
    bio: "Hello! I am Fatima, a medical student with a passion for baking, sketching, and helping others. I offer high-quality study companionship, friendly chats, and call services to help ease your stress and bring peace to your mind.",
    rating: 4.9,
    reviewsCount: 3,
    languages: ["Urdu", "English"],
    interests: ["Sketching", "Baking", "Medicine", "Novels", "Board Games"],
    services: ["study", "call", "movie"],
    status: CompanionStatus.APPROVED,
    isOnline: true,
    featured: false,
    pricingTier: "Silver",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400"
    ]
  },
  {
    id: "comp_7",
    name: "Sana Mir",
    age: 24,
    gender: CompanionGender.FEMALE,
    city: "Rawalpindi",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
    bio: "Hi! I am Sana, recently moved from Peshawar. I am waiting for approval to become an active companion here on Yarana.pk! I love long-distance travelling, traditional Pakistani food, and learning new languages.",
    rating: 0.0,
    reviewsCount: 0,
    languages: ["Pashto", "Urdu", "English"],
    interests: ["Travel", "Cooking", "Cultural Exchange", "Music"],
    services: ["travel", "dining", "call"],
    status: CompanionStatus.PENDING,
    isOnline: true,
    featured: false,
    pricingTier: "Silver"
  },
  {
    id: "comp_8",
    name: "Bilal Lodhi",
    age: 27,
    gender: CompanionGender.MALE,
    city: "Lahore",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400",
    bio: "Salam. I am Bilal, a software architect from Lahore. I am an aspiring companion who loves talking about technology, entrepreneurship, and video games. Looking forward to meeting open-minded individuals.",
    rating: 0.0,
    reviewsCount: 0,
    languages: ["Urdu", "English", "Punjabi"],
    interests: ["Gaming", "AI & Tech", "Business", "Gym"],
    services: ["study", "call", "day_spend"],
    status: CompanionStatus.PENDING,
    isOnline: false,
    featured: false,
    pricingTier: "Silver"
  }
];

export const INITIAL_REVIEWS = [
  {
    id: "rev_1",
    companionId: "comp_1",
    userName: "Zahid L.",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "Alizeh is an exceptional listener. We had an amazing dinner at Monal Lahore, and her thoughts on Sufi poetry and Ghalib were fascinating. She has a deep understanding of psychology which made the conversation extremely rich.",
    date: "2026-06-25"
  },
  {
    id: "rev_2",
    companionId: "comp_1",
    userName: "Kamil A.",
    userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
    rating: 4.8,
    comment: "Excellent on-call companion. Very calming voice and highly intelligent discussions about Lahore's history and modern literature. Felt very relaxed talking to her.",
    date: "2026-06-29"
  },
  {
    id: "rev_3",
    companionId: "comp_1",
    userName: "Saman T.",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "Had a wonderful study session at a library cafe with Alizeh. She was incredibly encouraging and helped me stay focused on my preparation. Highly recommended!",
    date: "2026-07-02"
  },
  {
    id: "rev_4",
    companionId: "comp_2",
    userName: "Zeeshan K.",
    userAvatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "Hamza accompanied me on a day trip hiking up Margalla Hills. Highly energetic, positive attitude, and took amazing pictures for my profile! He has a great sense of adventure.",
    date: "2026-06-18"
  },
  {
    id: "rev_5",
    companionId: "comp_2",
    userName: "Bilal A.",
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100",
    rating: 4.6,
    comment: "A great movie companion. We watched an IMAX movie in Islamabad, and it was so much fun discussing the sci-fi tropes afterward. Very friendly guy.",
    date: "2026-06-24"
  },
  {
    id: "rev_6",
    companionId: "comp_2",
    userName: "Murtaza H.",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
    rating: 4.8,
    comment: "Super nice call. Hamza is full of positive energy and great advice on fitness and tech. Really helped lift my mood.",
    date: "2026-07-01"
  },
  {
    id: "rev_7",
    companionId: "comp_3",
    userName: "Fahad M.",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    rating: 4.7,
    comment: "Zara is an amazing foodie! We went to Burns Road in Karachi for street food, and her knowledge of the best local spots is unmatched. Had a wonderful time talking about design.",
    date: "2026-06-20"
  },
  {
    id: "rev_8",
    companionId: "comp_3",
    userName: "Amna R.",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
    rating: 4.5,
    comment: "We had a lovely walk at Clifton Beach. Zara's optimistic vibe is contagious. Highly professional and extremely sweet.",
    date: "2026-06-28"
  },
  {
    id: "rev_9",
    companionId: "comp_3",
    userName: "Asad Y.",
    userAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100",
    rating: 4.9,
    comment: "Superb dining companion. We shared a beautiful meal, and she is extremely witty, polite, and respectful. Very positive experience.",
    date: "2026-07-03"
  },
  {
    id: "rev_10",
    companionId: "comp_4",
    userName: "Nabeel M.",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "Best study companion! Aisha helped me stay super focused on my corporate law studies. Her method is quiet, organized, and deeply motivating.",
    date: "2026-06-28"
  },
  {
    id: "rev_11",
    companionId: "comp_4",
    userName: "Khurram S.",
    userAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "Very peaceful call session. Aisha has an incredibly serene presence and is a wonderful listener. She gives you her undivided attention.",
    date: "2026-07-02"
  },
  {
    id: "rev_12",
    companionId: "comp_4",
    userName: "Mariam J.",
    userAvatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "We had a quiet evening dinner. She is extremely elegant, respectful, and has a wealth of knowledge on nature and gardening. Truly a gold standard companion.",
    date: "2026-07-04"
  },
  {
    id: "rev_13",
    companionId: "comp_5",
    userName: "Arsalan T.",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
    rating: 4.8,
    comment: "Sameer is a fantastic companion for networking and high-end dining. We went to a fine restaurant in Karachi, and his insights into business and economics were incredibly engaging.",
    date: "2026-06-15"
  },
  {
    id: "rev_14",
    companionId: "comp_5",
    userName: "Zain B.",
    userAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=100",
    rating: 4.5,
    comment: "An excellent travel companion. Sameer was very professional, handled the travel coordination perfectly, and we had great conversations about global history during the trip.",
    date: "2026-06-27"
  },
  {
    id: "rev_15",
    companionId: "comp_5",
    userName: "Usman K.",
    userAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=100",
    rating: 4.5,
    comment: "Great call session with Sameer. He is highly educated, speaks multiple languages fluently, and gave me some great business advice. Excellent companion.",
    date: "2026-07-03"
  },
  {
    id: "rev_16",
    companionId: "comp_6",
    userName: "Ayesha D.",
    userAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    comment: "Fatima is the sweetest companion. She helped me sketch at a peaceful park in Lahore and shared some delicious baked cookies she made. Such a heartwarming afternoon.",
    date: "2026-06-22"
  },
  {
    id: "rev_17",
    companionId: "comp_6",
    userName: "Hassan P.",
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100",
    rating: 4.8,
    comment: "Outstanding study companion. As a medical student herself, she is extremely disciplined and helped me structure my exam prep. Very respectful and kind.",
    date: "2026-06-30"
  },
  {
    id: "rev_18",
    companionId: "comp_6",
    userName: "Saad G.",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    rating: 4.9,
    comment: "Really enjoyed my phone call with Fatima. She is very understanding, comforting, and has a gentle way of putting you at ease. Felt much better after our talk.",
    date: "2026-07-05"
  }
];
