// src/components/ProfileAvatar.jsx
import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import { getProfilePictureSync, getUserData } from '../utils/auth';

const ProfileAvatar = ({ size = 'medium', onClick, style = {}, userData: propUserData }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // If userData is passed as a prop, use it directly
        if (propUserData) {
          setProfilePicture(propUserData.profile_picture_url);
          setUsername(propUserData.username || '');
          setLoading(false);
          return;
        }
        
        // Get user data from localStorage
        const userData = getUserData();
        if (userData) {
          console.log('ProfileAvatar: userData from localStorage:', userData);
          setProfilePicture(userData.profile_picture_url);
          setUsername(userData.username || '');
        } else {
          // Fallback to sync method if getUserData returns null
          const pictureUrl = getProfilePictureSync();
          console.log('ProfileAvatar: pictureUrl from sync method:', pictureUrl);
          setProfilePicture(pictureUrl);
          
          // Try to get username directly from localStorage
          try {
            const rawUserData = localStorage.getItem('user');
            if (rawUserData) {
              const parsedUserData = JSON.parse(rawUserData);
              setUsername(parsedUserData.username || '');
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [propUserData]);

  // Determine the size of the avatar
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: '32px', height: '32px', fontSize: '14px' };
      case 'large':
        return { width: '150px', height: '150px', fontSize: '48px' };
      case 'medium':
      default:
        return { width: '40px', height: '40px', fontSize: '18px' };
    }
  };

  // Get user initials for the fallback avatar
  const getInitials = () => {
    if (!username) return '';
    const nameParts = username.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  const sizeStyle = getSizeStyle();

  const styles = {
    avatarCircle: {
      ...sizeStyle,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: profilePicture ? 'transparent' : '#e5e7eb',
      color: '#4B5563',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ...style
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    fallbackIcon: {
      fontSize: sizeStyle.fontSize,
    },
    initialsText: {
      fontSize: sizeStyle.fontSize,
      fontWeight: 'bold',
    },
    loadingIndicator: {
      ...sizeStyle,
      borderRadius: '50%',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  };

  if (loading) {
    return <div style={styles.loadingIndicator}></div>;
  }

  return (
    <div style={styles.avatarCircle} onClick={onClick}>
      {profilePicture ? (
        <img 
          src={profilePicture} 
          alt={username || 'User'} 
          style={styles.avatarImage} 
          onError={(e) => {
            console.error("Error loading profile picture:", e);
            setProfilePicture(null);
          }}
        />
      ) : username ? (
        <span style={styles.initialsText}>{getInitials()}</span>
      ) : (
        <FaUser style={styles.fallbackIcon} />
      )}
    </div>
  );
};

export default ProfileAvatar;