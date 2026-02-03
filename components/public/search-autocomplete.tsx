"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (city: string) => void
  placeholder?: string
}

export function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar por ubicación...",
}: SearchAutocompleteProps) {
  const [cities, setCities] = useState<string[]>([])
  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/public/properties/cities")
      .then((res) => res.json())
      .then((data) => setCities(data.cities || []))
      .catch(() => setCities([]))
  }, [])

  useEffect(() => {
    if (value.length >= 2) {
      const filtered = cities.filter((city) => city.toLowerCase().includes(value.toLowerCase()))
      setFilteredCities(filtered.slice(0, 8))
      setIsOpen(filtered.length > 0)
    } else {
      setFilteredCities([])
      setIsOpen(false)
    }
    setHighlightedIndex(-1)
  }, [value, cities])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredCities.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0) {
          const selected = filteredCities[highlightedIndex]
          onSelect(selected.split(",")[0].trim())
          setIsOpen(false)
        }
        break
      case "Escape":
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && filteredCities.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="pl-10"
      />
      {isOpen && filteredCities.length > 0 && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-auto"
        >
          {filteredCities.map((city, index) => (
            <button
              key={city}
              type="button"
              className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-muted transition-colors ${
                index === highlightedIndex ? "bg-muted" : ""
              }`}
              onClick={() => {
                onSelect(city.split(",")[0].trim())
                setIsOpen(false)
              }}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
