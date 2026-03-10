export interface Booking {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  activity: string;
  date: string;
  time: string;
  venue: string;
  duration: number;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  canConfirmDone: boolean;
}

export const bookings: Booking[] = [
  {
    id: 'b1',
    friendId: '1',
    friendName: 'Sarah Mitchell',
    friendAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    activity: 'Dining Experience',
    date: 'Mar 2, 2026',
    time: '7:00 PM',
    venue: 'The Italian Place, Manhattan',
    duration: 2,
    price: 70,
    status: 'upcoming',
    canConfirmDone: false,
  },
  {
    id: 'b2',
    friendId: '2',
    friendName: 'James Chen',
    friendAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    activity: 'Mountain Hiking',
    date: 'Mar 5, 2026',
    time: '8:00 AM',
    venue: 'Muir Woods, San Francisco',
    duration: 4,
    price: 160,
    status: 'upcoming',
    canConfirmDone: false,
  },
  {
    id: 'b3',
    friendId: '4',
    friendName: 'Marcus Johnson',
    friendAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    activity: 'Bears Game Watch',
    date: 'Feb 22, 2026',
    time: '1:00 PM',
    venue: 'Soldier Field, Chicago',
    duration: 3,
    price: 135,
    status: 'completed',
    canConfirmDone: false,
  },
  {
    id: 'b4',
    friendId: '3',
    friendName: 'Emma Rodriguez',
    friendAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    activity: 'Salsa Dancing',
    date: 'Feb 18, 2026',
    time: '6:00 PM',
    venue: 'Havana Club, Miami',
    duration: 2,
    price: 60,
    status: 'completed',
    canConfirmDone: false,
  },
  {
    id: 'b5',
    friendId: '5',
    friendName: 'Yuki Tanaka',
    friendAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    activity: 'Photography Walk',
    date: 'Feb 20, 2026',
    time: '3:00 PM',
    venue: 'Little Tokyo, LA',
    duration: 3,
    price: 84,
    status: 'completed',
    canConfirmDone: false,
  },
  {
    id: 'b6',
    friendId: '6',
    friendName: 'Daniel Park',
    friendAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    activity: 'Coffee Tour',
    date: 'Feb 15, 2026',
    time: '10:00 AM',
    venue: 'Capitol Hill, Seattle',
    duration: 2,
    price: 76,
    status: 'cancelled',
    canConfirmDone: false,
  },
  {
    id: 'b7',
    friendId: '1',
    friendName: 'Sarah Mitchell',
    friendAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    activity: 'Shopping Trip',
    date: 'Feb 10, 2026',
    time: '11:00 AM',
    venue: 'SoHo, New York',
    duration: 3,
    price: 105,
    status: 'cancelled',
    canConfirmDone: false,
  },
];

