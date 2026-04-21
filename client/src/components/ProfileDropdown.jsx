import React, { useState, useRef, useEffect } from 'react'
import { getCurrentUser, logout } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

export default function ProfileDropdown({ darkMode, setDarkMode, onSettingsClick }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const user = getCurrentUser()

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.username?.[0]?.toUpperCase() || 'U'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  function handleLogout() {
    setShowDropdown(false)
    logout()
    navigate('/login')
  }

  function handleSettings() {
    setShowDropdown(false)
    if (onSettingsClick) onSettingsClick()
  }

  function handleThemeToggle() {
    setDarkMode(!darkMode)
    // Don't close dropdown so user can see theme change
  }

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        className="profile-icon-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        title={`${user?.name || user?.username}`}
      >
        <div className="profile-avatar">{getInitials()}</div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="profile-dropdown-menu">
          {/* User Info Header */}
          <div className="dropdown-header">
            <div className="dropdown-avatar-large">{getInitials()}</div>
            <div className="dropdown-info">
              {user?.name && <div className="dropdown-name">{user.name}</div>}
              <div className="dropdown-username">@{user?.username}</div>
              {user?.className && <div className="dropdown-class">{user.className}</div>}
            </div>
          </div>

          <div className="dropdown-divider"></div>

          {/* Menu Items */}
          <div className="dropdown-items">
            {/* Settings (Teacher Only) */}
            {user?.role === 'teacher' && (
              <>
                <button className="dropdown-item" onClick={handleSettings}>
                  <span className="dropdown-icon">⚙️</span>
                  <span>Settings</span>
                </button>
                <div className="dropdown-divider-small"></div>
              </>
            )}

            {/* Theme Toggle */}
            <button className="dropdown-item" onClick={handleThemeToggle}>
              <span className="dropdown-icon">{darkMode ? '☀️' : '🌙'}</span>
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <div className="dropdown-divider-small"></div>

            {/* Logout */}
            <button className="dropdown-item logout-item" onClick={handleLogout}>
              <span className="dropdown-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
