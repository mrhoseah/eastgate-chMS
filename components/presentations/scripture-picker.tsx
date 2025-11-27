"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, Plus } from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { useToast } from "@/hooks/use-toast";

interface ScripturePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameId?: string | null;
}

// Popular Bible books for quick access
const bibleBooks = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation',
];

// Sample verses for demonstration (in production, you'd fetch from an API)
const sampleVerses: Record<string, string[]> = {
  'John 3:16': ['"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."'],
  'Jeremiah 29:11': ['"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."'],
  'Philippians 4:13': ['"I can do all this through him who gives me strength."'],
  'Romans 8:28': ['"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."'],
  'Proverbs 3:5-6': ['"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."'],
  'Isaiah 40:31': ['"But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."'],
  'Matthew 28:19-20': ['"Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age."'],
};

export function ScripturePicker({ open, onOpenChange, frameId }: ScripturePickerProps) {
  const { addElement, selectedFrameId } = usePresentationEditorStore();
  const { toast } = useToast();
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);

  const targetFrameId = frameId || selectedFrameId;

  const handleAddVerse = () => {
    if (!targetFrameId) {
      toast({
        title: "No Frame Selected",
        description: "Please select a frame first",
        variant: "destructive",
      });
      return;
    }

    const reference = `${book} ${chapter}:${verse}`.trim();
    const verseText = sampleVerses[reference]?.[0] || `"Your verse text here..."`;

    // Add verse reference as title
    addElement(targetFrameId, {
      type: 'text',
      content: reference,
      position: { x: 50, y: 50 },
      size: { width: 500, height: 40 },
      rotation: 0,
      style: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8b4513',
        textAlign: 'center',
      },
    });

    // Add verse text
    addElement(targetFrameId, {
      type: 'text',
      content: verseText,
      position: { x: 50, y: 110 },
      size: { width: 500, height: 200 },
      rotation: 0,
      style: {
        fontSize: 24,
        color: '#1a1a2e',
        textAlign: 'center',
      },
    });

    toast({
      title: "Verse Added",
      description: `${reference} has been added to the slide`,
    });

    // Reset form
    setBook('');
    setChapter('');
    setVerse('');
    setSelectedVerse(null);
    onOpenChange(false);
  };

  const handleQuickAdd = (reference: string) => {
    if (!targetFrameId) {
      toast({
        title: "No Frame Selected",
        description: "Please select a frame first",
        variant: "destructive",
      });
      return;
    }

    const [bookName, chapterVerse] = reference.split(' ');
    const [chap, vers] = chapterVerse.split(':');
    
    setBook(bookName);
    setChapter(chap);
    setVerse(vers);
    setSelectedVerse(reference);
  };

  const filteredBooks = bibleBooks.filter(b =>
    b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVerses = Object.keys(sampleVerses).filter(v =>
    v.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Add Scripture Verse
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Search and add Bible verses to your slide
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Quick Verse Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Quick Add (Sample Verses)
            </label>
            <ScrollArea className="h-32 border border-gray-700 rounded-lg p-2">
              <div className="flex flex-wrap gap-2">
                {Object.keys(sampleVerses).map((ref) => (
                  <Button
                    key={ref}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(ref)}
                    className={`text-xs ${selectedVerse === ref ? 'bg-blue-600 border-blue-500' : ''}`}
                  >
                    {ref}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Manual Entry */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300 block">
              Or Enter Manually
            </label>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Book (e.g., John)"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  list="books-list"
                />
                <datalist id="books-list">
                  {bibleBooks.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <Input
                placeholder="Chapter"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-24 bg-gray-800 border-gray-700 text-white"
                type="number"
              />
              <Input
                placeholder="Verse"
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
                className="w-24 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {book && chapter && verse && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Preview:</div>
                <div className="text-lg font-bold text-blue-400 mb-2">
                  {book} {chapter}:{verse}
                </div>
                <div className="text-gray-300 italic">
                  {sampleVerses[`${book} ${chapter}:${verse}`]?.[0] || 'Verse text will appear here...'}
                </div>
              </div>
            )}
          </div>

          {/* Book Search */}
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            {searchQuery && (
              <ScrollArea className="h-32 border border-gray-700 rounded-lg p-2">
                <div className="space-y-1">
                  {filteredBooks.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setBook(b);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm text-gray-300"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddVerse}
            disabled={!book || !chapter || !verse || !targetFrameId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Verse
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

