import { Link } from "wouter";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import storiesData from "@/data/stories.json";

export default function News() {
  const stories = [...storiesData].reverse();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Game Recap":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "League News":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Announcement":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Player Spotlight":
        return "bg-gold-500/20 text-gold-400 border-gold-500/30";
      case "Team Feature":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/40 border-b border-gold-500/20">
        <div className="container py-6">
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </a>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gold-400 mb-2">
            News & Stories 📰
          </h1>
          <p className="text-gray-300">
            Breaking news, features, and analysis from around the Hall of Fame Basketball Association
          </p>
        </div>
      </div>

      {/* Stories List */}
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="bg-black/60 border-gold-500/30 hover:border-gold-400/50 transition-all"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Badge
                    variant="outline"
                    className={`${getCategoryColor(story.category)} border`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {story.category}
                  </Badge>
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(story.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <CardTitle className="text-2xl md:text-3xl text-gold-400 leading-tight">
                  {story.headline}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {story.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <Card className="bg-gold-500/10 border-gold-500/30">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold text-gold-400 mb-3">
                Stay Updated
              </h3>
              <p className="text-gray-300 mb-4">
                Check back regularly for the latest news, game recaps, and player spotlights from Season 17
              </p>
              <Link href="/recaps">
                <a className="inline-block bg-gold-500 hover:bg-gold-600 text-black font-bold px-6 py-3 rounded-lg transition-colors">
                  View Game Recaps
                </a>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
