import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home,
  Search,
  Radio,
  Library,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Mic2,
  ListMusic,
  Sliders,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tv,
  ExternalLink,
  Music,
  Disc,
  Clock,
  RadioTower
} from 'lucide-react';
import {
  SkeletonShortcuts,
  SkeletonShelves,
  SkeletonTracklist,
  SkeletonBox
} from './components/SkeletonLoader';

const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='160' height='160' fill='%23282828'/%3E%3C/svg%3E";
const DEFAULT_COVER_LG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23282828'/%3E%3C/svg%3E";

const cleanHtmlText = (str) => {
  if (!str) return '';
  return str
    .replace(/<[^>]*>?/gm, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

const GENRES = [
  { name: 'Pop', color: '#8d67ab', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
  { name: 'Hip-Hop', color: '#ba5d07', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80' },
  { name: 'Rock', color: '#e91429', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80' },
  { name: 'Electronic / Dance', color: '#006450', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80' },
  { name: 'Indie & Alt', color: '#608108', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  { name: 'Chill & Lofi', color: '#477d95', img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80' },
  { name: 'R&B', color: '#dc148c', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80' },
  { name: 'Workout', color: '#777777', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80' },
  { name: 'Focus & Study', color: '#503750', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&auto=format&fit=crop&q=80' },
  { name: 'Sleep & Ambient', color: '#1e3264', img: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?w=300&auto=format&fit=crop&q=80' },
  { name: 'Gaming', color: '#e8115b', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80' },
  { name: 'Jazz & Blues', color: '#bc5900', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&auto=format&fit=crop&q=80' },
];

const CURATED_PLAYLISTS = {
  daily1: {
    title: 'Daily Mix 1',
    desc: 'M83, The Weeknd, Daft Punk, MGMT',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    tracks: [
      { id: 't1', title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", durationMs: 243000, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' },
      { id: 't2', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', album: 'Starboy', durationMs: 230000, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' },
      { id: 't3', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80' },
      { id: 't10', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', album: 'Random Access Memories', durationMs: 248000, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80' }
    ]
  },
  daily2: {
    title: 'Daily Mix 2',
    desc: 'Coldplay, Radiohead, Oasis, The Killers',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    tracks: [
      { id: 't11', title: 'Yellow', artist: 'Coldplay', album: 'Parachutes', durationMs: 269000, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' },
      { id: 't12', title: 'Karma Police', artist: 'Radiohead', album: 'OK Computer', durationMs: 264000, image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80' },
      { id: 't13', title: 'Wonderwall', artist: 'Oasis', album: "(What's the Story) Morning Glory?", durationMs: 258000, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' }
    ]
  },
  discover: {
    title: 'Discover Weekly',
    desc: 'Your weekly mixtape of fresh music. Updated every Monday.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    tracks: [
      { id: 't4', title: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular', durationMs: 229000, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80' },
      { id: 't5', title: 'Kids', artist: 'MGMT', album: 'Oracular Spectacular', durationMs: 302000, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' }
    ]
  },
  release: {
    title: 'Release Radar',
    desc: 'Catch all the latest music from artists you follow.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    tracks: [
      { id: 't6', title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", durationMs: 167000, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80' }
    ]
  },
  top50: {
    title: "Today's Top Hits",
    desc: 'The hottest tracks right now across the globe.',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    tracks: [
      { id: 't7', title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', durationMs: 178000, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80' },
      { id: 't14', title: 'Espresso', artist: 'Sabrina Carpenter', album: "Short n' Sweet", durationMs: 175000, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' }
    ]
  },
  lofi: {
    title: 'Lofi Chill Beats',
    desc: 'Beats to relax, study, and code to. 24/7 cozy vibes.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    tracks: [
      { id: 't8', title: 'Snowman', artist: 'Wun Two', album: 'Rio', durationMs: 154000, image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80' },
      { id: 't15', title: 'Affection', artist: 'Jinsang', album: 'Life', durationMs: 132000, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' }
    ]
  }
};

const SHORTCUT_ITEMS = [
  { id: 'daily1', title: 'Daily Mix 1', image: CURATED_PLAYLISTS.daily1.image },
  { id: 'daily2', title: 'Daily Mix 2', image: CURATED_PLAYLISTS.daily2.image },
  { id: 'discover', title: 'Discover Weekly', image: CURATED_PLAYLISTS.discover.image },
  { id: 'release', title: 'Release Radar', image: CURATED_PLAYLISTS.release.image },
  { id: 'top50', title: "Today's Top Hits", image: CURATED_PLAYLISTS.top50.image },
  { id: 'lofi', title: 'Lofi Chill Beats', image: CURATED_PLAYLISTS.lofi.image },
];

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [activePanelTab, setActivePanelTab] = useState('lyrics'); // 'lyrics' | 'queue' | 'story'
  const [theme, setTheme] = useState(() => localStorage.getItem('myspoti_theme') || 'classic');

  // Spotify Session State
  const [hasSession, setHasSession] = useState(false);
  const [sessionInput, setSessionInput] = useState(() => localStorage.getItem('myspoti_sp_dc') || '');
  const [modalSettingsOpen, setModalSettingsOpen] = useState(false);
  const [modalEqOpen, setModalEqOpen] = useState(false);
  const [modalVideoOpen, setModalVideoOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Audio Playback Source Engine ('both' | 'youtube' | 'spotify')
  const [audioSource, setAudioSource] = useState(() => localStorage.getItem('myspoti_audio_source') || 'both');
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [showVideoDock, setShowVideoDock] = useState(false);
  const [syncedVideo, setSyncedVideo] = useState(null);

  // Audio Playback State
  const [currentTrack, setCurrentTrack] = useState({
    id: 't1',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    durationMs: 243000,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(243);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('myspoti_liked_tracks') || '["t1", "t3"]'));
    } catch {
      return new Set(['t1', 't3']);
    }
  });

  // Shelves, Search, Radio, Detail State
  const [homeFeed, setHomeFeed] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [userLibrary, setUserLibrary] = useState(null);
  const [userLikedSongs, setUserLikedSongs] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [radioStations, setRadioStations] = useState([]);
  const [loadingRadio, setLoadingRadio] = useState(false);
  const [detailData, setDetailData] = useState({
    type: 'playlist',
    id: 'daily1',
    title: 'Daily Mix 1',
    desc: 'M83, The Weeknd, Daft Punk, MGMT',
    image: CURATED_PLAYLISTS.daily1.image,
    tracks: CURATED_PLAYLISTS.daily1.tracks
  });
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [queue, setQueue] = useState(CURATED_PLAYLISTS.daily1.tracks);

  // Synchronized Lyrics & Story
  const [lyricsData, setLyricsData] = useState(null);
  const [geniusStory, setGeniusStory] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  // Equalizer Bands (10 Bands)
  const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const playbackSourceRef = useRef('track'); // 'track' | 'radio'
  const lyricsContainerRef = useRef(null);

  // Apply Theme
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('myspoti_theme', theme);
  }, [theme]);

  // Initial Session Check & Home Load
  useEffect(() => {
    checkSession();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const checkSession = async () => {
    setLoadingHome(true);
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.has_session) {
          setHasSession(true);
          loadHome();
          loadLibrary();
          return;
        }
      }
    } catch {}

    // Check localStorage fallback
    const localSpDc = localStorage.getItem('myspoti_sp_dc');
    if (localSpDc) {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sp_dc: localSpDc })
        });
        if (res.ok) {
          setHasSession(true);
          loadHome();
          loadLibrary();
          return;
        }
      } catch {}
    }

    setHasSession(false);
    setLoadingHome(false);
  };

  const loadHome = async () => {
    setLoadingHome(true);
    try {
      const res = await fetch('/api/home');
      if (res.ok) {
        const data = await res.json();
        setHomeFeed(data);
      } else {
        setHomeFeed(null);
      }
    } catch {
      setHomeFeed(null);
    } finally {
      setTimeout(() => setLoadingHome(false), 250);
    }
  };

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const [libRes, likedRes] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/library/liked')
      ]);
      if (libRes.ok) {
        const libData = await libRes.json();
        setUserLibrary(libData);
      }
      if (likedRes.ok) {
        const likedData = await likedRes.json();
        const rawTracks = likedData?.data?.me?.library?.tracks?.items || likedData?.me?.library?.tracks?.items || [];
        const mapped = rawTracks.map((t, idx) => {
          const trackData = t.track?.data || t.track || {};
          const artists = (trackData.artists?.items || []).map(a => a.profile?.name || a.name).filter(Boolean).join(', ') || 'Unknown Artist';
          const durationSec = Math.floor((trackData.duration?.totalMilliseconds || 210000) / 1000);
          return {
            id: trackData.id || trackData.uri?.split(':')?.[2] || `liked-${idx}`,
            title: trackData.name || 'Untitled',
            artist: artists,
            album: trackData.albumOfTrack?.name || 'Liked Songs',
            duration: `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`,
            durationSec: durationSec,
            image: trackData.albumOfTrack?.coverArt?.sources?.[0]?.url || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80'
          };
        });
        setUserLikedSongs(mapped);
      }
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const saveSession = async (cookie) => {
    const trimmed = cookie.trim();
    if (trimmed) {
      localStorage.setItem('myspoti_sp_dc', trimmed);
    } else {
      localStorage.removeItem('myspoti_sp_dc');
    }
    setSessionInput(trimmed);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sp_dc: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        const connected = !!trimmed;
        setHasSession(connected);
        setModalSettingsOpen(false);
        showToast(connected ? 'Spotify session connected & saved!' : 'Spotify session cleared');
        loadHome();
        loadLibrary();
      } else {
        showToast('Failed to save session');
      }
    } catch (e) {
      showToast('Error saving session: ' + e.message);
    }
  };

  // On-demand YouTube Player Engine (Loads and streams audio reliably with zero muting)
  const loadAndPlayYT = (videoId) => {
    if (!videoId) return;

    if (ytPlayerRef.current && ytReadyRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
        ytPlayerRef.current.playVideo();
      } catch (e) {
        console.warn('Error loading YT video:', e);
      }
      return;
    }

    const init = () => {
      if (ytPlayerRef.current || !window.YT || !window.YT.Player) return;
      try {
        ytPlayerRef.current = new window.YT.Player('myspoti-persistent-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            enablejsapi: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (e) => {
              ytReadyRef.current = true;
              try {
                e.target.unMute();
                e.target.setVolume(isMuted ? 0 : volume);
                e.target.playVideo();
              } catch (err) {}
            },
            onStateChange: (e) => {
              if (e.data === 1) setIsPlaying(true);
              else if (e.data === 2) setIsPlaying(false);
              else if (e.data === 0) handleTrackEnd();
            }
          }
        });
      } catch (err) {
        console.warn('YT init error:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        init();
      };
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }
  };

  // Real Playback Time Synchronization (Lyrics & Scrubber)
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (playbackSourceRef.current === 'track' && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (cur > 0) setCurrentTime(cur);
            if (dur > 0 && Math.abs(dur - duration) > 1) setDuration(dur);
          } catch {}
        } else if (playbackSourceRef.current === 'radio' && audioRef.current && !audioRef.current.paused) {
          setCurrentTime(audioRef.current.currentTime);
        } else {
          setCurrentTime((prev) => {
            if (prev >= duration) {
              handleTrackEnd();
              return 0;
            }
            return prev + 0.5;
          });
        }
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      seekTo(0);
      setIsPlaying(true);
      if (playbackSourceRef.current === 'track' && ytPlayerRef.current?.playVideo) {
        ytPlayerRef.current.playVideo();
      }
    } else {
      handleNextTrack();
    }
  };

  const handleNextTrack = () => {
    if (!queue || queue.length === 0) return;
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * queue.length);
      playTrack(queue[nextIdx], queue);
      return;
    }
    const curIdx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (curIdx + 1) % queue.length;
    playTrack(queue[nextIdx], queue);
  };

  const handlePrevTrack = () => {
    if (!queue || queue.length === 0) return;
    if (currentTime > 3) {
      seekTo(0);
      return;
    }
    const curIdx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (curIdx - 1 + queue.length) % queue.length;
    playTrack(queue[prevIdx], queue);
  };

  const playTrack = async (track, trackQueue = null) => {
    playbackSourceRef.current = 'track';
    setCurrentTrack(track);
    if (trackQueue && trackQueue.length > 0) {
      setQueue(trackQueue);
    }
    setIsPlaying(true);
    setCurrentTime(0);
    const dur = track.durationMs ? Math.round(track.durationMs / 1000) : 210;
    setDuration(dur);

    // Stop any active radio stream or preview audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Fetch synchronized lyrics & genius story
    fetchLyrics(track.id, track.title, track.artist);
    fetchGenius(track.title, track.artist);

    // Audio Playback by User Preference
    if (audioSource === 'spotify') {
      if (track.previewUrl) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        audioRef.current = new Audio(track.previewUrl);
        audioRef.current.volume = isMuted ? 0 : volume / 100;
        audioRef.current.play().catch(e => console.warn('Spotify preview play warning:', e));
        return;
      }
      // If Spotify preview is unavailable, automatically stream audio seamlessly so user always hears sound!
      showToast('Streaming full track via high-fidelity audio engine...');
    }

    // Both / Hybrid or YouTube Mode (or fallback for full track audio):
    try {
      const res = await fetch(`/api/video/sync?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
      if (res.ok) {
        const data = await res.json();
        setSyncedVideo(data);
        if (data.videoId) {
          loadAndPlayYT(data.videoId);
        }
      }
    } catch (e) {
      console.warn('Video sync warning:', e);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (playbackSourceRef.current === 'track' && ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (playbackSourceRef.current === 'track' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
          ytPlayerRef.current.playVideo();
        } catch (e) {}
      }
      if (playbackSourceRef.current === 'radio' && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(clamped);
    if (playbackSourceRef.current === 'track' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(clamped, true);
    }
    if (playbackSourceRef.current === 'radio' && audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const toggleLikeCurrentTrack = () => {
    if (!currentTrack?.id) return;
    const newLiked = new Set(likedTracks);
    if (newLiked.has(currentTrack.id)) {
      newLiked.delete(currentTrack.id);
      showToast('Removed from Liked Songs');
    } else {
      newLiked.add(currentTrack.id);
      showToast('Saved to Your Liked Songs');
    }
    setLikedTracks(newLiked);
    localStorage.setItem('myspoti_liked_tracks', JSON.stringify(Array.from(newLiked)));
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    showToast(!isShuffle ? 'Shuffle turned ON' : 'Shuffle turned OFF');
  };

  const toggleRepeat = () => {
    const next = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(next);
    showToast(`Repeat mode: ${next.toUpperCase()}`);
  };

  const fetchLyrics = async (id, title, artist) => {
    setLoadingLyrics(true);
    try {
      const res = await fetch(`/api/lyrics/${id}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (res.ok) {
        const data = await res.json();
        setLyricsData(data);
      } else {
        setLyricsData(null);
      }
    } catch {
      setLyricsData(null);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const fetchGenius = async (title, artist) => {
    try {
      const res = await fetch(`/api/genius/meaning?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (res.ok) {
        const data = await res.json();
        setGeniusStory(data);
      } else {
        setGeniusStory(null);
      }
    } catch {
      setGeniusStory(null);
    }
  };

  const openDetail = async (type, id, title, image, desc, autoPlay = false) => {
    setPreviousTab(activeTab);
    setActiveTab('detail');
    setLoadingDetail(true);

    if (CURATED_PLAYLISTS[id]) {
      const p = CURATED_PLAYLISTS[id];
      const data = {
        type,
        id,
        title: p.title,
        desc: p.desc,
        image: p.image,
        tracks: p.tracks
      };
      setDetailData(data);
      setLoadingDetail(false);
      if (autoPlay && p.tracks.length > 0) {
        playTrack(p.tracks[0], p.tracks);
      }
      return;
    }

    try {
      const endpoint = type === 'album' ? `/api/album/${id}` : `/api/playlist/${id}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const raw = await res.json();
        let rawTracks = [];
        let headerTitle = title;
        let headerImage = image;

        let headerDesc = desc;

        if (type === 'album') {
          const alb = raw?.albumUnion || raw?.data?.albumUnion || raw;
          headerTitle = alb.name || title;
          headerImage = alb.coverArt?.sources?.[0]?.url || image;
          headerDesc = alb.artists?.items?.map(a => a.profile?.name).filter(Boolean).join(', ') || alb.description || desc;
          rawTracks = alb.tracksV2?.items || alb.tracks?.items || [];
        } else {
          const pl = raw?.playlistV2 || raw?.data?.playlistV2 || raw;
          headerTitle = pl.name || title;
          headerImage = pl.images?.items?.[0]?.sources?.[0]?.url || image;
          headerDesc = pl.description || pl.attributes?.find(a => a.key === 'description')?.value || desc;
          rawTracks = pl.content?.items || pl.tracks?.items || [];
        }

        const tracks = rawTracks.map((item, idx) => {
          const t = item?.track || item?.itemV2?.data || item?.item?.data || item;
          const uri = t.uri || '';
          const artists = t.artists?.items?.map(a => a.profile?.name || a.name).filter(Boolean).join(', ')
            || t.artists?.[0]?.name
            || 'Various Artists';
          const durMs = t.duration?.totalMilliseconds || 210000;
          const durSec = Math.floor(durMs / 1000);

          return {
            id: uri.replace('spotify:track:', '') || `track_${idx}`,
            title: t.name || 'Untitled',
            artist: artists,
            album: t.albumOfTrack?.name || t.album?.name || headerTitle,
            duration: `${Math.floor(durSec / 60)}:${String(durSec % 60).padStart(2, '0')}`,
            durationSec: durSec,
            durationMs: durMs,
            image: t.albumOfTrack?.coverArt?.sources?.[0]?.url || headerImage || DEFAULT_COVER
          };
        });

        const data = {
          type,
          id,
          title: headerTitle,
          desc: cleanHtmlText(headerDesc) || `${tracks.length} songs`,
          image: headerImage || DEFAULT_COVER_LG,
          tracks
        };
        setDetailData(data);
        if (autoPlay && tracks.length > 0) {
          playTrack(tracks[0], tracks);
        }
      }
    } catch {
      showToast('Could not load online playlist');
    } finally {
      setLoadingDetail(false);
    }
  };

  const libraryPlaylists = useMemo(() => {
    const rawItems = userLibrary?.data?.me?.libraryV3?.items || userLibrary?.me?.libraryV3?.items || [];
    return rawItems.map(it => {
      const d = it.item?.data || it.item || {};
      const uri = d.uri || '';
      const name = d.name || d.title || d.profile?.name || 'Untitled';
      const type = uri.startsWith('spotify:album:') ? 'album' : uri.startsWith('spotify:artist:') ? 'artist' : 'playlist';
      const id = uri.split(':')?.[2] || '';
      const image = d.images?.items?.[0]?.sources?.[0]?.url
        || d.coverArt?.sources?.[0]?.url
        || d.visualIdentity?.squareCoverImage?.sources?.[0]?.url
        || DEFAULT_COVER;
      const subtitle = cleanHtmlText(d.description) || d.ownerV2?.data?.name || (type === 'artist' ? 'Artist' : 'Playlist');
      return { id, uri, name, type, image, subtitle };
    }).filter(p => p.id && p.type !== 'artist');
  }, [userLibrary]);

  const dynamicSections = useMemo(() => {
    const rawSections = homeFeed?.data?.home?.sectionContainer?.sections?.items
      || homeFeed?.home?.sectionContainer?.sections?.items
      || [];

    return rawSections.map((s) => {
      const sData = s.data || {};
      const title = sData.title?.transformedLabel
        || (sData.__typename === 'HomeShortsSectionData' ? 'Recently Played & Quick Picks' : null);
      const items = (s.sectionItems?.items || []).map((it) => {
        const c = it.content || {};
        const d = c.data || {};
        const uri = d.uri || '';
        const name = d.name || d.title || d.profile?.name;
        if (!name || !uri) return null;

        const type = uri.startsWith('spotify:album:') ? 'album' : uri.startsWith('spotify:artist:') ? 'artist' : 'playlist';
        const id = uri.split(':')?.[2] || '';
        const image = d.images?.items?.[0]?.sources?.[0]?.url
          || d.coverArt?.sources?.[0]?.url
          || d.visualIdentity?.squareCoverImage?.sources?.[0]?.url
          || DEFAULT_COVER;
        const subtitle = cleanHtmlText(d.description)
          || d.artists?.items?.map(a => a.profile?.name || a.name).filter(Boolean).join(', ')
          || (type === 'album' ? 'Album' : 'Playlist');

        return { id, uri, name, type, image, subtitle };
      }).filter(Boolean);

      return { title, items };
    }).filter(sec => sec.title && sec.items.length > 0);
  }, [homeFeed]);

  const shortcutList = useMemo(() => {
    if (dynamicSections.length > 0 && dynamicSections[0].items.length > 0) {
      return dynamicSections[0].items.slice(0, 6);
    }
    return SHORTCUT_ITEMS;
  }, [dynamicSections]);

  const searchItems = useMemo(() => {
    if (!searchResults?.searchV2) return [];
    const list = [];
    const topHits = searchResults.searchV2.topResultsV2?.itemsV2 || searchResults.searchV2.topResults?.itemsV2 || [];
    for (const item of topHits) {
      const raw = item?.item?.data || item?.data || {};
      const uri = raw.uri || '';
      const name = raw.name || raw.profile?.name || raw.title;
      if (!name || !uri) continue;
      const type = uri.startsWith('spotify:album:') ? 'album' : uri.startsWith('spotify:playlist:') ? 'playlist' : uri.startsWith('spotify:artist:') ? 'artist' : 'track';
      const id = uri.split(':')?.[2] || '';
      const artist = raw.artists?.items?.map(a => a.profile?.name).filter(Boolean).join(', ')
        || raw.profile?.name
        || raw.subtitle
        || type.toUpperCase();
      const image = raw.albumOfTrack?.coverArt?.sources?.[0]?.url
        || raw.coverArt?.sources?.[0]?.url
        || raw.visualIdentity?.squareCoverImage?.sources?.[0]?.url
        || raw.images?.items?.[0]?.sources?.[0]?.url
        || DEFAULT_COVER;
      list.push({ id, uri, name, type, artist, image });
    }
    const trackHits = searchResults.searchV2.tracksV2?.items || [];
    for (const item of trackHits) {
      const raw = item?.item?.data || item?.track?.data || item?.data || {};
      const uri = raw.uri || '';
      const name = raw.name || raw.title;
      if (!name || !uri) continue;
      const id = uri.split(':')?.[2] || '';
      if (list.some(x => x.id === id)) continue;
      const artist = raw.artists?.items?.map(a => a.profile?.name).filter(Boolean).join(', ') || 'Unknown Artist';
      const image = raw.albumOfTrack?.coverArt?.sources?.[0]?.url || DEFAULT_COVER;
      list.push({ id, uri, name, type: 'track', artist, image });
    }
    return list;
  }, [searchResults]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults({ error: 'Spotify session required for search' });
      }
    } catch {
      setSearchResults({ error: 'Search failed' });
    } finally {
      setLoadingSearch(false);
    }
  };

  const loadRadioStations = async () => {
    setActiveTab('radio');
    if (radioStations.length > 0) return;
    setLoadingRadio(true);
    try {
      const res = await fetch('/api/radio/stations');
      if (res.ok) {
        const data = await res.json();
        setRadioStations(data);
      }
    } catch {} finally {
      setLoadingRadio(false);
    }
  };

  const playRadioStation = (station) => {
    playbackSourceRef.current = 'radio';
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }
    const radioTrack = {
      id: `radio_${station.name}`,
      title: station.name,
      artist: `${station.country || 'Global'} • Live Radio`,
      album: `${station.codec || 'MP3'} ${station.bitrateKbps || 128}kbps`,
      durationMs: 0,
      image: station.favicon || DEFAULT_COVER
    };
    setCurrentTrack(radioTrack);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (station.streamUrl) {
      audioRef.current = new Audio(station.streamUrl);
      audioRef.current.volume = isMuted ? 0 : volume / 100;
      audioRef.current.play().catch(e => console.warn('Stream play warning:', e));
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Synchronized Lyrics active line
  const currentMs = currentTime * 1000;
  let activeLyricIdx = -1;
  if (lyricsData?.lines) {
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (currentMs >= lyricsData.lines[i].startTimeMs) {
        activeLyricIdx = i;
      } else {
        break;
      }
    }
  }

  return (
    <>
      <div className="ambient-backdrop" />
      <div className="app-root">
        {/* ================= Sidebar Navigation ================= */}
        <aside className="sidebar-nav">
          <div className="brand">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
            </svg>
            <span className="brand-name">Myspoti</span>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={22} />
              <span>Home</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={22} />
              <span>Search</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'radio' ? 'active' : ''}`}
              onClick={loadRadioStations}
            >
              <Radio size={22} />
              <span>Live Radio</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              <Library size={22} />
              <span>Your Library</span>
            </button>
          </nav>

          <div className="sidebar-divider" />

          {/* Quick Liked Songs Card */}
          <div
            className="shortcut-card"
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => {
              setActiveTab('detail');
              setDetailData({
                type: 'playlist',
                id: 'liked',
                title: 'Liked Songs',
                desc: `${userLikedSongs.length || likedTracks.size} favorite songs`,
                image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
                tracks: userLikedSongs.length > 0 ? userLikedSongs : CURATED_PLAYLISTS.daily1.tracks.filter(t => likedTracks.has(t.id))
              });
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={18} fill="#ffffff" color="#ffffff" />
            </div>
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: '0.9rem' }}>Liked Songs ({userLikedSongs.length || likedTracks.size})</span>
          </div>

          {/* Synced Spotify Library Playlists in Sidebar */}
          <div className="sidebar-library" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, paddingRight: 4 }}>
            {libraryPlaylists.map((item, idx) => (
              <div
                key={idx}
                className="shortcut-card"
                style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}
                onClick={() => openDetail(item.type, item.id, item.name, item.image, item.subtitle)}
              >
                <img src={item.image || DEFAULT_COVER} alt={item.name} style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} />
                <div style={{ marginLeft: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.subtitle || 'Playlist'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <button
              className="session-btn"
              onClick={() => setModalSettingsOpen(true)}
              title="Spotify Session Settings"
            >
              <div className={`status-dot ${hasSession ? '' : 'disconnected'}`} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {hasSession ? 'Spotify Connected' : 'Connect Spotify'}
              </span>
              <Settings size={16} color="var(--text-muted)" />
            </button>
          </div>
        </aside>

        {/* ================= Main Stage ================= */}
        <main className="main-stage">
          {/* Stage Top Navigation Bar */}
          <header className="stage-header">
            <div className="header-nav-buttons">
              <button
                className="round-nav-btn"
                onClick={() => setActiveTab(previousTab || 'home')}
                title="Go Back"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="round-nav-btn"
                onClick={() => setActiveTab('home')}
                title="Go Home"
              >
                <ChevronRight size={20} />
              </button>

              {activeTab === 'search' && (
                <div className="search-box-wrapper" style={{ marginLeft: 12 }}>
                  <input
                    type="text"
                    placeholder="What do you want to play?"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="header-actions">
              <button
                className="round-nav-btn"
                onClick={() => {
                  const next = theme === 'classic' ? 'immersive' : theme === 'immersive' ? 'amoled' : 'classic';
                  setTheme(next);
                  showToast(`Theme: ${next.toUpperCase()}`);
                }}
                title="Toggle Ambient Theme"
              >
                <Sparkles size={18} />
              </button>
              <button
                className="round-nav-btn"
                onClick={() => setModalSettingsOpen(true)}
                title="Settings & Spotify Auth"
              >
                <Settings size={18} />
              </button>
            </div>
          </header>

          {/* ================= TAB 1: HOME ================= */}
          {activeTab === 'home' && (
            <div className="tab-view active">
              <div className="home-header-row">
                <h1 className="view-title" style={{ margin: 0 }}>{getGreeting()}</h1>
                <div className="home-filter-chips">
                  <button className="chip-btn active">All</button>
                  <button className="chip-btn" onClick={() => showToast('Filtered by Music')}>Music</button>
                  <button className="chip-btn" onClick={() => showToast('Filtered by Podcasts')}>Podcasts</button>
                </div>
              </div>

              {/* 6 Shortcut Cards with Skeleton fallback */}
              {loadingHome ? (
                <SkeletonShortcuts count={6} />
              ) : (
                <div className="home-shortcuts-grid">
                  {shortcutList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="shortcut-card"
                      onClick={() => openDetail(item.type || 'playlist', item.id, item.title || item.name, item.image, item.subtitle || CURATED_PLAYLISTS[item.id]?.desc)}
                    >
                      <img src={item.image} alt={item.title || item.name} />
                      <span className="shortcut-title">{item.title || item.name}</span>
                      <button
                        className="shortcut-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(item.type || 'playlist', item.id, item.title || item.name, item.image, item.subtitle || CURATED_PLAYLISTS[item.id]?.desc, true);
                        }}
                      >
                        <Play size={18} fill="#000000" color="#000000" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Connected / Disconnected Info Banner */}
              {!hasSession && (
                <div style={{
                  background: 'rgba(30, 215, 96, 0.08)',
                  border: '1px solid rgba(30, 215, 96, 0.25)',
                  borderRadius: 12,
                  padding: '18px 24px',
                  marginBottom: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>
                      Personalize with Your Spotify Account
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Enter your Spotify <code>sp_dc</code> cookie to seamlessly sync your Made For You mixes, Liked Songs, and daily recommendations.
                    </p>
                  </div>
                  <button
                    className="chip-btn active"
                    style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
                    onClick={() => setModalSettingsOpen(true)}
                  >
                    Connect Session
                  </button>
                </div>
              )}

              {/* Shelves with Skeleton fallback */}
              {loadingHome ? (
                <SkeletonShelves shelvesCount={2} cardsPerShelf={4} />
              ) : dynamicSections.length > 0 ? (
                <div className="media-shelves">
                  {dynamicSections.map((sec, idx) => (
                    <div key={idx} className="shelf-section" style={{ marginBottom: 36 }}>
                      <h2 className="view-title" style={{ fontSize: '1.4rem', marginBottom: 16 }}>{sec.title}</h2>
                      <div className="media-grid">
                        {sec.items.map((item, itIdx) => (
                          <div
                            key={itIdx}
                            className="media-card"
                            onClick={() => openDetail(item.type, item.id, item.name, item.image, item.subtitle)}
                          >
                            <div className="card-art-wrap">
                              <img src={item.image} alt={item.name} />
                              <button
                                className="card-play-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(item.type, item.id, item.name, item.image, item.subtitle, true);
                                }}
                              >
                                <Play size={22} fill="#000000" color="#000000" />
                              </button>
                            </div>
                            <div className="title">{item.name}</div>
                            <div className="desc">{cleanHtmlText(item.subtitle)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="media-shelves">
                  <div className="shelf-section" style={{ marginBottom: 36 }}>
                    <h2 className="view-title" style={{ fontSize: '1.4rem', marginBottom: 16 }}>Made For You</h2>
                    <div className="media-grid">
                      {['daily1', 'daily2', 'discover', 'release'].map((key) => {
                        const item = CURATED_PLAYLISTS[key];
                        return (
                          <div
                            key={key}
                            className="media-card"
                            onClick={() => openDetail('playlist', key, item.title, item.image, item.desc)}
                          >
                            <div className="card-art-wrap">
                              <img src={item.image} alt={item.title} />
                              <button
                                className="card-play-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail('playlist', key, item.title, item.image, item.desc, true);
                                }}
                              >
                                <Play size={22} fill="#000000" color="#000000" />
                              </button>
                            </div>
                            <div className="title">{item.title}</div>
                            <div className="desc">{item.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="shelf-section" style={{ marginBottom: 36 }}>
                    <h2 className="view-title" style={{ fontSize: '1.4rem', marginBottom: 16 }}>Popular & Trending</h2>
                    <div className="media-grid">
                      {['top50', 'lofi'].map((key) => {
                        const item = CURATED_PLAYLISTS[key];
                        return (
                          <div
                            key={key}
                            className="media-card"
                            onClick={() => openDetail('playlist', key, item.title, item.image, item.desc)}
                          >
                            <div className="card-art-wrap">
                              <img src={item.image} alt={item.title} />
                              <button
                                className="card-play-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail('playlist', key, item.title, item.image, item.desc, true);
                                }}
                              >
                                <Play size={22} fill="#000000" color="#000000" />
                              </button>
                            </div>
                            <div className="title">{item.title}</div>
                            <div className="desc">{item.desc}</div>
                          </div>
                        );
                      })}

                      {/* Live Radio Teaser Card */}
                      <div
                        className="media-card"
                        onClick={loadRadioStations}
                      >
                        <div className="card-art-wrap" style={{ background: 'linear-gradient(135deg, #1db954, #191414)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <RadioTower size={54} color="#ffffff" />
                          <button className="card-play-btn">
                            <Play size={22} fill="#000000" color="#000000" />
                          </button>
                        </div>
                        <div className="title">Global Live Radio</div>
                        <div className="desc">30+ free high-fidelity streams</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: SEARCH ================= */}
          {activeTab === 'search' && (
            <div className="tab-view active">
              {!searchQuery.trim() ? (
                <>
                  <h2 className="view-title" style={{ fontSize: '1.4rem', marginBottom: 20 }}>Browse all</h2>
                  <div className="media-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {GENRES.map((g, idx) => (
                      <div
                        key={idx}
                        className="media-card"
                        style={{
                          backgroundColor: g.color,
                          height: 120,
                          borderRadius: 12,
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSearch(g.name)}
                      >
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{g.name}</h3>
                        <img
                          src={g.img}
                          alt={g.name}
                          style={{
                            position: 'absolute',
                            right: -10,
                            bottom: -5,
                            width: 76,
                            height: 76,
                            borderRadius: 6,
                            transform: 'rotate(25deg)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : loadingSearch ? (
                <SkeletonShelves shelvesCount={1} cardsPerShelf={6} />
              ) : searchResults?.error ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: 12 }}>
                  <Disc size={48} color="var(--accent)" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Spotify Session Required</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 20px auto' }}>
                    Connect your Spotify account with your <code>sp_dc</code> cookie to search songs, artists, and playlists across Spotify's entire catalog.
                  </p>
                  <button
                    className="chip-btn active"
                    style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 24px' }}
                    onClick={() => setModalSettingsOpen(true)}
                  >
                    Open Settings (sp_dc)
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="view-title" style={{ fontSize: '1.3rem', marginBottom: 16 }}>Results for "{searchQuery}"</h2>
                  <div className="media-grid">
                    {searchItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="media-card"
                        onClick={() => {
                          if (item.type === 'album') openDetail('album', item.id, item.name, item.image, item.artist);
                          else if (item.type === 'playlist') openDetail('playlist', item.id, item.name, item.image, item.artist);
                          else playTrack({ id: item.id, title: item.name, artist: item.artist, image: item.image });
                        }}
                      >
                        <div className="card-art-wrap">
                          <img src={item.image} alt={item.name} />
                          <button className="card-play-btn">
                            <Play size={22} fill="#000000" color="#000000" />
                          </button>
                        </div>
                        <div className="title">{item.name}</div>
                        <div className="desc">{item.artist}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: RADIO ================= */}
          {activeTab === 'radio' && (
            <div className="tab-view active">
              <div style={{ marginBottom: 24 }}>
                <h1 className="view-title" style={{ margin: 0 }}>Free Live Radio</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                  Stream global FM/AM radio stations directly with zero restrictions or ads.
                </p>
              </div>

              {loadingRadio ? (
                <SkeletonShelves shelvesCount={2} cardsPerShelf={4} />
              ) : (
                <div className="media-grid">
                  {radioStations.map((station, idx) => (
                    <div
                      key={idx}
                      className="media-card"
                      onClick={() => playRadioStation(station)}
                    >
                      <div className="card-art-wrap" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {station.favicon ? (
                          <img src={station.favicon} alt={station.name} onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <Radio size={40} color="var(--accent)" />
                        )}
                        <button className="card-play-btn">
                          <Play size={22} fill="#000000" color="#000000" />
                        </button>
                      </div>
                      <div className="title">{station.name}</div>
                      <div className="desc">{station.country || 'Global'} • {station.codec} {station.bitrateKbps}kbps</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: LIBRARY ================= */}
          {activeTab === 'library' && (
            <div className="tab-view active">
              <div className="home-header-row">
                <h1 className="view-title" style={{ margin: 0 }}>Your Library</h1>
                <div className="home-filter-chips">
                  <button className="chip-btn active">All</button>
                  <button className="chip-btn">Playlists</button>
                  <button className="chip-btn">Artists</button>
                  <button className="chip-btn">Albums</button>
                </div>
              </div>

              {loadingLibrary ? (
                <SkeletonShelves shelvesCount={2} cardsPerShelf={4} />
              ) : (
                <div className="media-grid">
                  {/* Liked Songs Big Card */}
                  <div
                    className="media-card"
                    style={{
                      background: 'linear-gradient(135deg, #450af5, #8e8ee5)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveTab('detail');
                      setDetailData({
                        type: 'playlist',
                        id: 'liked',
                        title: 'Liked Songs',
                        desc: `${userLikedSongs.length || likedTracks.size} saved favorite tracks from Spotify`,
                        image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
                        tracks: userLikedSongs.length > 0 ? userLikedSongs : CURATED_PLAYLISTS.daily1.tracks.filter(t => likedTracks.has(t.id))
                      });
                    }}
                  >
                    <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', paddingBottom: 16 }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Liked Songs ({userLikedSongs.length || likedTracks.size})
                      </p>
                    </div>
                    <div className="title" style={{ color: '#fff' }}>Auto-synced collection</div>
                    <div className="desc" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {userLikedSongs.length > 0 ? `${userLikedSongs.length} tracks synced with Spotify` : 'Updated in real-time'}
                    </div>
                  </div>

                  {/* Synced Spotify Playlists */}
                  {libraryPlaylists.map((item, idx) => (
                    <div
                      key={idx}
                      className="media-card"
                      onClick={() => openDetail(item.type, item.id, item.name, item.image, item.subtitle)}
                    >
                      <div className="card-art-wrap">
                        <img src={item.image} alt={item.name} />
                        <button
                          className="card-play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(item.type, item.id, item.name, item.image, item.subtitle, true);
                          }}
                        >
                          <Play size={22} fill="#000000" color="#000000" />
                        </button>
                      </div>
                      <div className="title">{item.name}</div>
                      <div className="desc">{cleanHtmlText(item.subtitle)}</div>
                    </div>
                  ))}

                  {/* Fallback to curated playlists if library empty */}
                  {libraryPlaylists.length === 0 && Object.entries(CURATED_PLAYLISTS).map(([key, item]) => (
                    <div
                      key={key}
                      className="media-card"
                      onClick={() => openDetail('playlist', key, item.title, item.image, item.desc)}
                    >
                      <div className="card-art-wrap">
                        <img src={item.image} alt={item.title} />
                        <button className="card-play-btn">
                          <Play size={22} fill="#000000" color="#000000" />
                        </button>
                      </div>
                      <div className="title">{item.title}</div>
                      <div className="desc">PLAYLIST • {item.tracks.length} songs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 5: DETAIL (Playlist / Album) ================= */}
          {activeTab === 'detail' && (
            <div className="tab-view active">
              {/* Detail Banner Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 24,
                marginBottom: 28,
                paddingBottom: 24,
                borderBottom: '1px solid var(--glass-border)',
                flexWrap: 'wrap'
              }}>
                <img
                  src={detailData.image}
                  alt={detailData.title}
                  style={{
                    width: 192,
                    height: 192,
                    borderRadius: 12,
                    objectFit: 'cover',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {detailData.type}
                  </span>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '8px 0 12px 0', letterSpacing: '-1px' }}>
                    {detailData.title}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 12, lineHeight: 1.5 }}>
                    {cleanHtmlText(detailData.desc)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        transition: 'transform 0.15s'
                      }}
                      onClick={() => {
                        if (detailData.tracks.length > 0) {
                          if (currentTrack?.id === detailData.tracks[0]?.id) {
                            togglePlay();
                          } else {
                            playTrack(detailData.tracks[0], detailData.tracks);
                          }
                        }
                      }}
                      title="Play All"
                    >
                      {isPlaying && detailData.tracks.some(t => t.id === currentTrack?.id) ? (
                        <Pause size={24} fill="#000000" color="#000000" />
                      ) : (
                        <Play size={24} fill="#000000" color="#000000" style={{ marginLeft: 3 }} />
                      )}
                    </button>
                    <button
                      className="round-nav-btn"
                      style={{ width: 40, height: 40 }}
                      onClick={() => showToast('Saved to your Spotify library!')}
                      title="Save Playlist"
                    >
                      <Heart size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tracklist with Skeleton Loading fallback */}
              {loadingDetail ? (
                <SkeletonTracklist count={8} />
              ) : (
                <div className="tracklist-container">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 1fr 60px',
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--glass-border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <span>#</span>
                    <span>Title</span>
                    <span>Album</span>
                    <span style={{ textAlign: 'right' }}><Clock size={14} /></span>
                  </div>

                  {detailData.tracks.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isLiked = likedTracks.has(track.id);

                    return (
                      <div
                        key={track.id}
                        className={`track-row ${isCurrent ? 'active' : ''}`}
                        onClick={() => playTrack(track, detailData.tracks)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 1fr 60px',
                          alignItems: 'center',
                          padding: '10px 16px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <span style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {isCurrent && isPlaying ? (
                            <Play size={14} fill="var(--accent)" color="var(--accent)" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: isCurrent ? 'var(--accent)' : '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                            {track.title}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {track.artist}
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {track.album || 'Single'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? 'var(--accent)' : 'var(--text-muted)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newLiked = new Set(likedTracks);
                              if (newLiked.has(track.id)) newLiked.delete(track.id);
                              else newLiked.add(track.id);
                              setLikedTracks(newLiked);
                              localStorage.setItem('myspoti_liked_tracks', JSON.stringify(Array.from(newLiked)));
                            }}
                          >
                            <Heart size={16} fill={isLiked ? 'var(--accent)' : 'none'} />
                          </button>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {formatTime((track.durationMs || 210000) / 1000)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ================= Right Side Drawer (Lyrics, Queue, Story) ================= */}
        <aside className="now-playing-panel" style={{
          gridArea: 'panel',
          background: 'var(--glass-bg)',
          borderLeft: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 18px',
          overflow: 'hidden'
        }}>
          {/* Panel Selector Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
            <button
              className={`chip-btn ${activePanelTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('lyrics')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <Mic2 size={14} />
              <span>Lyrics</span>
            </button>
            <button
              className={`chip-btn ${activePanelTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('queue')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <ListMusic size={14} />
              <span>Queue</span>
            </button>
            <button
              className={`chip-btn ${activePanelTab === 'story' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('story')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              <Sparkles size={14} />
              <span>Story</span>
            </button>
          </div>

          {/* Drawer 1: Synchronized Karaoke Lyrics */}
          {activePanelTab === 'lyrics' && (
            <div
              ref={lyricsContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                paddingRight: 6
              }}
            >
              {loadingLyrics ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonBox key={i} style={{ height: 28, width: `${60 + (i % 4) * 10}%`, borderRadius: 6 }} />
                  ))}
                </div>
              ) : lyricsData?.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.map((line, idx) => {
                  const isActive = idx === activeLyricIdx;
                  return (
                    <p
                      key={idx}
                      onClick={() => seekTo(line.startTimeMs / 1000)}
                      style={{
                        fontSize: isActive ? '1.4rem' : '1.05rem',
                        fontWeight: 800,
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        lineHeight: 1.4,
                        margin: 0
                      }}
                    >
                      {line.words && line.words.length > 0
                        ? line.words.map((w, wIdx) => {
                            const isWordActive = currentMs >= w.startTimeMs && currentMs <= w.endTimeMs;
                            return (
                              <span
                                key={wIdx}
                                style={{
                                  color: isWordActive ? 'var(--accent)' : 'inherit',
                                  textShadow: isWordActive ? '0 0 12px var(--accent-glow)' : 'none'
                                }}
                              >
                                {w.word}{' '}
                              </span>
                            );
                          })
                        : line.text}
                    </p>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--text-muted)' }}>
                  <Mic2 size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontWeight: 600 }}>Enjoying the music?</p>
                  <p style={{ fontSize: '0.85rem' }}>No synchronized lyrics available for this track.</p>
                </div>
              )}
            </div>
          )}

          {/* Drawer 2: Queue */}
          {activePanelTab === 'queue' && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                Now Playing
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
                <img src={currentTrack.image || DEFAULT_COVER} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {currentTrack.title}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentTrack.artist}</div>
                </div>
              </div>

              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 14, marginBottom: 4 }}>
                Next Up ({queue.length} tracks)
              </span>
              {queue.map((t, idx) => (
                <div
                  key={t.id + '_' + idx}
                  onClick={() => playTrack(t, queue)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: t.id === currentTrack.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 16 }}>{idx + 1}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: t.id === currentTrack.id ? 'var(--accent)' : '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drawer 3: Song Meaning & Story */}
          {activePanelTab === 'story' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>
                  Behind The Lyrics
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {geniusStory?.about || geniusStory?.meaning ||
                    `"${currentTrack.title}" by ${currentTrack.artist} is recognized on Spotify for its dynamic production, emotive melody, and signature vocal style.`}
                </p>
                {geniusStory?.notes && geniusStory.notes.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: 8 }}>Community Annotations:</h4>
                    {geniusStory.notes.slice(0, 3).map((n, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                        <div style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--accent)' }}>"{n.fragment}"</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{n.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {geniusStory?.found ? 'Source: Genius Verified Community' : 'Source: Spotify & YouTube'}
                  </span>
                  {geniusStory?.url && (
                    <a href={geniusStory.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ================= Bottom Capsule Player ================= */}
        <footer className="player-capsule">
          {/* Left: Track Summary & Like */}
          <div className="track-summary">
            <img
              src={currentTrack.image || DEFAULT_COVER}
              alt={currentTrack.title}
              className="cover-art"
              style={{ cursor: 'pointer' }}
              onClick={() => setMobileSheetOpen(true)}
            />
            <div className="track-meta" style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0, flex: 1 }} onClick={() => setMobileSheetOpen(true)}>
              <div className="track-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </div>
              <div className="track-artist" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.artist}
              </div>
            </div>
            <button
              className={`icon-btn ${likedTracks.has(currentTrack.id) ? 'active' : ''}`}
              onClick={toggleLikeCurrentTrack}
              title="Save to Liked Songs"
              style={{ color: likedTracks.has(currentTrack.id) ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}
            >
              <Heart size={20} fill={likedTracks.has(currentTrack.id) ? 'var(--accent)' : 'none'} />
            </button>
          </div>

          {/* Center: Playback Controls & Scrubber */}
          <div className="playback-controls">
            <div className="button-row">
              <button
                className={`icon-btn ${isShuffle ? 'active' : ''}`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>
              <button
                className="icon-btn"
                onClick={handlePrevTrack}
                title="Previous Track"
              >
                <SkipBack size={20} />
              </button>
              <button
                className="btn-play play-pause-btn"
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={20} fill="#000000" color="#000000" />
                ) : (
                  <Play size={20} fill="#000000" color="#000000" style={{ marginLeft: 2 }} />
                )}
              </button>
              <button
                className="icon-btn"
                onClick={handleNextTrack}
                title="Next Track"
              >
                <SkipForward size={20} />
              </button>
              <button
                className={`icon-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                onClick={toggleRepeat}
                title={`Repeat (${repeatMode})`}
              >
                <Repeat size={18} />
              </button>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="progress-bar-container">
              <span className="time-label">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
              />
              <span className="time-label">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Auxiliary Controls (Lyrics, Queue, Equalizer, Video, Volume) */}
          <div className="extra-controls">
            <button
              className={`icon-btn ${activePanelTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('lyrics')}
              title="Lyrics View"
            >
              <Mic2 size={18} />
            </button>
            <button
              className={`icon-btn ${activePanelTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('queue')}
              title="Queue View"
            >
              <ListMusic size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setModalEqOpen(true)}
              title="10-Band Equalizer & FX"
            >
              <Sliders size={18} />
            </button>
            <button
              className={`icon-btn ${isTheaterOpen ? 'active' : ''}`}
              onClick={() => {
                if (audioSource === 'spotify') {
                  showToast('Video is available in Hybrid or YouTube mode (Change in Settings)');
                } else {
                  setShowVideoDock(!showVideoDock);
                }
              }}
              title={audioSource === 'spotify' ? 'Video disabled in Spotify-only mode' : 'Toggle Music Video Dock'}
            >
              <Tv size={18} />
            </button>

            {/* Volume Slider */}
            <div className="volume-container">
              <button
                className="icon-btn"
                onClick={() => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
                    if (nextMuted) ytPlayerRef.current.mute();
                    else {
                      ytPlayerRef.current.unMute();
                      ytPlayerRef.current.setVolume(volume);
                    }
                  }
                  if (audioRef.current) audioRef.current.muted = nextMuted;
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setVolume(v);
                  setIsMuted(false);
                  if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
                    ytPlayerRef.current.unMute();
                    ytPlayerRef.current.setVolume(v);
                  }
                  if (audioRef.current) {
                    audioRef.current.volume = v / 100;
                    audioRef.current.muted = false;
                  }
                }}
              />
            </div>
          </div>
        </footer>

        {/* ================= Mobile Bottom Bar (< 768px) ================= */}
        <nav className="mobile-bottom-bar" style={{ display: 'none' }}>
          <button className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <Search size={20} />
            <span>Search</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'radio' ? 'active' : ''}`} onClick={loadRadioStations}>
            <Radio size={20} />
            <span>Radio</span>
          </button>
          <button className={`mobile-nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            <Library size={20} />
            <span>Library</span>
          </button>
        </nav>

        {/* ================= Modal 1: Spotify Settings & Session ================= */}
        {modalSettingsOpen && (
          <div className="modal-backdrop active" onClick={() => setModalSettingsOpen(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Spotify Session Settings</h2>
                <button className="round-nav-btn" onClick={() => setModalSettingsOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  Paste your Spotify web cookie (<code>sp_dc</code>) below. It connects the Axum backend to your personal library, private playlists, and daily feeds. It is securely saved in <code>config/session.json</code>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Spotify Cookie (sp_dc)
                  </label>
                  <input
                    type="password"
                    placeholder="AQB... (Paste your sp_dc cookie value)"
                    value={sessionInput}
                    onChange={(e) => setSessionInput(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--glass-border)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Audio Playback Source Engine Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Music size={16} color="var(--accent)" />
                    Audio Playback Source Engine
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Select where full-track music streams are sourced from:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <button
                      type="button"
                      className={`chip-btn ${audioSource === 'both' ? 'active' : ''}`}
                      onClick={() => {
                        setAudioSource('both');
                        localStorage.setItem('myspoti_audio_source', 'both');
                        showToast('Audio Source: Hybrid (Spotify + YouTube)');
                      }}
                      style={{
                        padding: '10px 6px',
                        textAlign: 'center',
                        background: audioSource === 'both' ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                        color: audioSource === 'both' ? '#000' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: audioSource === 'both' ? 'none' : '1px solid var(--glass-border)',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      Both / Hybrid
                    </button>
                    <button
                      type="button"
                      className={`chip-btn ${audioSource === 'youtube' ? 'active' : ''}`}
                      onClick={() => {
                        setAudioSource('youtube');
                        localStorage.setItem('myspoti_audio_source', 'youtube');
                        showToast('Audio Source: YouTube Only');
                      }}
                      style={{
                        padding: '10px 6px',
                        textAlign: 'center',
                        background: audioSource === 'youtube' ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                        color: audioSource === 'youtube' ? '#000' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: audioSource === 'youtube' ? 'none' : '1px solid var(--glass-border)',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      YouTube
                    </button>
                    <button
                      type="button"
                      className={`chip-btn ${audioSource === 'spotify' ? 'active' : ''}`}
                      onClick={() => {
                        setAudioSource('spotify');
                        localStorage.setItem('myspoti_audio_source', 'spotify');
                        setShowVideoDock(false);
                        setIsTheaterOpen(false);
                        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
                          ytPlayerRef.current.pauseVideo();
                        }
                        showToast('Audio Source: Spotify Only');
                      }}
                      style={{
                        padding: '10px 6px',
                        textAlign: 'center',
                        background: audioSource === 'spotify' ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                        color: audioSource === 'spotify' ? '#000' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: audioSource === 'spotify' ? 'none' : '1px solid var(--glass-border)',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      Spotify Only
                    </button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: 2 }}>
                    {audioSource === 'both' && '⚡ Hybrid Mode: Streams full high-fidelity audio via YouTube, perfectly synced with Spotify metadata and real-time lyrics.'}
                    {audioSource === 'youtube' && '▶ YouTube Only: Always streams official audio and music videos directly from YouTube.'}
                    {audioSource === 'spotify' && '🟢 Spotify Only: Streams official Spotify 30s preview audio (requires Premium for full tracks via Connect).'}
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>How to extract your sp_dc cookie:</p>
                  <ol style={{ paddingLeft: 18, margin: 0 }}>
                    <li>Log into <a href="https://open.spotify.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>open.spotify.com</a></li>
                    <li>Press <kbd>F12</kbd> &rarr; <strong>Application</strong> / <strong>Storage</strong> &rarr; <strong>Cookies</strong></li>
                    <li>Select <code>https://open.spotify.com</code> and copy the value of <code>sp_dc</code></li>
                  </ol>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button
                  className="chip-btn"
                  onClick={() => saveSession('')}
                  style={{ color: '#ff4f7b' }}
                >
                  Clear Session
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="chip-btn" onClick={() => setModalSettingsOpen(false)}>Cancel</button>
                  <button
                    className="chip-btn active"
                    style={{ background: 'var(--accent)', color: '#000', border: 'none' }}
                    onClick={() => saveSession(sessionInput)}
                  >
                    Save & Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= Modal 2: 10-Band Equalizer & FX ================= */}
        {modalEqOpen && (
          <div className="modal-backdrop active" onClick={() => setModalEqOpen(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sliders size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Graphic Equalizer & Audio FX</h2>
                </div>
                <button className="round-nav-btn" onClick={() => setModalEqOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {/* EQ Preset Selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Sound Profile Preset:</span>
                  <select
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      color: '#fff',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: '0.85rem'
                    }}
                    onChange={(e) => {
                      const presets = {
                        flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        bass_boost: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
                        vocal_boost: [-1, -1, 0, 2, 4, 4, 2, 0, -1, -2],
                        rock: [4, 3, 2, 0, -1, 0, 2, 3, 4, 4],
                        electronic: [5, 4, 2, 0, -1, 2, 1, 2, 4, 5]
                      };
                      const val = presets[e.target.value] || presets.flat;
                      setEqGains(val);
                      showToast(`Preset: ${e.target.value.toUpperCase()}`);
                    }}
                  >
                    <option value="flat">Flat (Default)</option>
                    <option value="bass_boost">Bass Boost 🔥</option>
                    <option value="vocal_boost">Vocal Boost 🎤</option>
                    <option value="rock">Rock / Metal 🎸</option>
                    <option value="electronic">Electronic / EDM ⚡</option>
                  </select>
                </div>

                {/* 10 Slider Columns */}
                <div style={{ display: 'flex', justifyContent: 'space-between', height: 180, alignItems: 'center', padding: '0 8px' }}>
                  {eqFrequencies.map((freq, idx) => (
                    <div key={freq} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                        {eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]}dB
                      </span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={eqGains[idx]}
                        onChange={(e) => {
                          const next = [...eqGains];
                          next[idx] = parseFloat(e.target.value);
                          setEqGains(next);
                        }}
                        style={{
                          writingMode: 'vertical-lr',
                          direction: 'rtl',
                          width: 28,
                          flex: 1,
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {freq >= 1000 ? `${freq / 1000}k` : freq}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  className="chip-btn active"
                  style={{ background: 'var(--accent)', color: '#000', border: 'none' }}
                  onClick={() => {
                    setModalEqOpen(false);
                    showToast('Equalizer settings applied');
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= Persistent Audio & Video Player Dock / Theater ================= */}
        <div
          style={isTheaterOpen ? {
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          } : (showVideoDock && audioSource !== 'spotify') ? {
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: 300,
            height: 180,
            zIndex: 80,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            border: '1px solid var(--glass-border)',
            background: '#050505',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          } : {
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: 240,
            height: 180,
            opacity: 0.001,
            pointerEvents: 'none',
            zIndex: -1
          }}
          onClick={() => {
            if (isTheaterOpen) setIsTheaterOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={isTheaterOpen ? {
              width: 'min(90vw, 880px)',
              aspectRatio: '16/9',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
              border: '1px solid var(--glass-border)',
              background: '#000',
              position: 'relative'
            } : {
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            {/* Dock Header with Title & Action Controls */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '8px 12px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.88), transparent)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <Tv size={14} color="var(--accent)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.title} &bull; {currentTrack.artist}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsTheaterOpen(!isTheaterOpen)}
                  title={isTheaterOpen ? "Minimize to Mini-Dock" : "Expand Video Theater"}
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Tv size={12} />
                  <span>{isTheaterOpen ? "Dock" : "Theater"}</span>
                </button>
                {!isTheaterOpen && (
                  <button
                    type="button"
                    onClick={() => setShowVideoDock(false)}
                    title="Hide video window (audio continues playing in background)"
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: 'none',
                      borderRadius: 6,
                      color: '#fff',
                      padding: '4px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Persistent IFrame Mount */}
            <div id="myspoti-persistent-player" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* ================= Floating Toast Notification ================= */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 215, 96, 0.95)',
            color: '#000000',
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '10px 22px',
            borderRadius: 30,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none'
          }}>
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </>
  );
}
