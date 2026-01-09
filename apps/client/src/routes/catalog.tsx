import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@bookie/ui/components/ui/button";
import { Input } from "@bookie/ui/components/ui/input";
import { Label } from "@bookie/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bookie/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bookie/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bookie/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bookie/ui/components/ui/table";
import { Badge } from "@bookie/ui/components/ui/badge";
import {
  IconPlus,
  IconSearch,
  IconBook,
  IconLoader2,
  IconEdit,
  IconBarcode,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/catalog")({
  component: CatalogPage,
});

function CatalogPage() {
  return (
    <AppLayout title="Catalog">
      <CatalogContent />
    </AppLayout>
  );
}

function CatalogContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const booksData = useQuery(api.books.list, {
    status: (statusFilter as any) || undefined,
  });

  const searchResults = useQuery(
    api.books.searchByTitle,
    searchQuery.trim().length >= 2 ? { searchTerm: searchQuery.trim() } : "skip"
  );

  const statsData = useQuery(api.books.getStats, {});

  const books = searchQuery.trim().length >= 2 ? searchResults : booksData;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions - Move to a row with better spacing on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">Manage book inventory and catalog</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </DialogTrigger>
          <AddBookDialog onClose={() => setShowAddDialog(false)} />
        </Dialog>
      </div>

      {/* Stats Cards - Responsive grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Books</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {statsData?.total ?? <IconLoader2 className="h-5 w-5 animate-spin" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-green-600">Available</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {statsData?.statusCounts?.available ?? "0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-amber-600">Borrowed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">
              {statsData?.statusCounts?.borrowed ?? "0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Value</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold whitespace-nowrap">
              ₱{statsData?.totalValue?.toLocaleString() ?? "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Responsive layout */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="borrowed">Borrowed</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="weeded">Weeded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Books Table - With overflow scroll */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {books === undefined ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : books.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconBook className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No books found</p>
                <p className="text-muted-foreground text-sm px-4">
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first book to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Accession</TableHead>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[150px]">Author</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book: any) => (
                    <BookRow key={book._id} book={book} />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookRow({ book }: { book: any }) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-600">Available</Badge>;
      case "borrowed":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            Borrowed
          </Badge>
        );
      case "lost":
        return <Badge variant="destructive">Lost</Badge>;
      case "damaged":
        return <Badge variant="destructive">Damaged</Badge>;
      case "weeded":
        return <Badge variant="secondary">Weeded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs sm:text-sm">{book.accessionNumber}</TableCell>
        <TableCell>
          <div className="font-medium text-sm sm:text-base">{book.title}</div>
          {book.isbn && (
            <div className="text-[10px] sm:text-xs text-muted-foreground">ISBN: {book.isbn}</div>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{book.author}</TableCell>
        <TableCell className="hidden md:table-cell text-sm">{book.category || "-"}</TableCell>
        <TableCell>{getStatusBadge(book.status)}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <IconEdit className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditBookDialog book={book} onClose={() => setShowEditDialog(false)} />
      </Dialog>
    </>
  );
}

function AddBookDialog({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    accessionNumber: "",
    title: "",
    author: "",
    isbn: "",
    category: "",
    publisher: "",
    publishYear: "",
    copies: "1",
    replacementCost: "",
    location: "",
    pages: "",
    coverUrl: "",
  });

  const createBook = useMutation(api.books.create);
  const nextAccession = useQuery(api.books.getNextAccessionNumber, {});
  const generateUploadUrl = useMutation(api.books.generateUploadUrl);

  const handleCoverUpload = async (file: File) => {
    setCoverFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleIsbnLookup = async () => {
    if (!formData.isbn || formData.isbn.length < 10) {
      toast.error("Please enter a valid ISBN (10 or 13 digits)");
      return;
    }

    setIsLookingUp(true);
    try {
      const { lookupIsbn, normalizeIsbn, isValidIsbn } = await import(
        "@/lib/isbn-lookup"
      );
      const normalized = normalizeIsbn(formData.isbn);

      if (!isValidIsbn(normalized)) {
        toast.error("Invalid ISBN format");
        return;
      }

      const metadata = await lookupIsbn(normalized);

      if (!metadata) {
        toast.error("Book not found", {
          description: "No results for this ISBN",
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        title: metadata.title || prev.title,
        author: metadata.author || prev.author,
        publisher: metadata.publisher || prev.publisher,
        publishYear: metadata.publicationYear?.toString() || prev.publishYear,
        pages: metadata.pages?.toString() || prev.pages,
        coverUrl: metadata.coverUrl || prev.coverUrl,
      }));

      toast.success("Book found!", {
        description: `"${metadata.title}" by ${metadata.author}`,
      });
    } catch (error: any) {
      toast.error("Lookup failed", { description: error.message });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Upload cover image if selected
      let coverStorageId: string | undefined;
      if (coverFile) {
        setIsUploading(true);
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": coverFile.type },
          body: coverFile,
        });
        const { storageId } = await result.json();
        coverStorageId = storageId;
        setIsUploading(false);
      }

      await createBook({
        accessionNumber: formData.accessionNumber || nextAccession || "",
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || undefined,
        category: formData.category || "general",
        publisher: formData.publisher || undefined,
        publicationYear: formData.publishYear
          ? Number(formData.publishYear)
          : undefined,
        replacementCost: formData.replacementCost
          ? Number(formData.replacementCost)
          : 500,
        location: formData.location || "General",
        pages: formData.pages ? Number(formData.pages) : undefined,
        condition: "good",
      });
      toast.success("Book added successfully!");
      onClose();
    } catch (error: any) {
      toast.error("Failed to add book", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>Add New Book</DialogTitle>
        <DialogDescription>
          Enter book details or scan ISBN to auto-fill.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          {/* ISBN Lookup Section */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <Label className="text-sm font-medium mb-2 block">
              Quick ISBN Lookup
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter ISBN (10 or 13 digits)"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleIsbnLookup}
                disabled={isLookingUp || !formData.isbn}
              >
                {isLookingUp ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <IconSearch className="h-4 w-4 mr-1" />
                    Lookup
                  </>
                )}
              </Button>
            </div>
            {(formData.coverUrl || coverPreview) && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={coverPreview || formData.coverUrl}
                  alt="Book cover"
                  className="w-16 h-24 object-cover rounded shadow"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {coverPreview ? "Custom cover" : "Cover from Open Library"}
                </span>
              </div>
            )}
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground block mb-2">
                Or upload cover:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                  }}
                  className="text-xs h-9"
                />
                {isUploading && (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accession">Accession Number</Label>
              <div className="flex gap-2">
                <Input
                  id="accession"
                  placeholder={nextAccession || "Auto-generated"}
                  value={formData.accessionNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accessionNumber: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      accessionNumber: nextAccession || "",
                    })
                  }
                >
                  <IconBarcode className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pages">Pages</Label>
              <Input
                id="pages"
                type="number"
                placeholder="e.g., 320"
                value={formData.pages}
                onChange={(e) =>
                  setFormData({ ...formData, pages: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Book title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              placeholder="Author name"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiction">Fiction</SelectItem>
                  <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="textbook">Textbook</SelectItem>
                  <SelectItem value="periodical">Periodical</SelectItem>
                  <SelectItem value="children">Children's</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                placeholder="Publisher name"
                value={formData.publisher}
                onChange={(e) =>
                  setFormData({ ...formData, publisher: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                value={formData.publishYear}
                onChange={(e) =>
                  setFormData({ ...formData, publishYear: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₱)</Label>
              <Input
                id="cost"
                type="number"
                placeholder="500"
                value={formData.replacementCost}
                onChange={(e) =>
                  setFormData({ ...formData, replacementCost: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Shelf A-3"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.title || !formData.author}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Book"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditBookDialog({ book, onClose }: { book: any; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn || "",
    category: book.category || "",
    publisher: book.publisher || "",
    publishYear: book.publishYear ? String(book.publishYear) : "",
    replacementCost: book.replacementCost ? String(book.replacementCost) : "",
    location: book.location || "",
    status: book.status,
    condition: book.condition || "good",
  });

  const updateBook = useMutation(api.books.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await updateBook({
        id: book._id as Id<"books">,
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || undefined,
        category: formData.category || undefined,
        publisher: formData.publisher || undefined,
        publicationYear: formData.publishYear
          ? Number(formData.publishYear)
          : undefined,
        replacementCost: formData.replacementCost
          ? Number(formData.replacementCost)
          : undefined,
        location: formData.location || undefined,
        condition: formData.condition as any,
      });
      toast.success("Book updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error("Failed to update book", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>Edit Book</DialogTitle>
        <DialogDescription>Update details for {book.title}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Accession Number</Label>
              <Input
                value={book.accessionNumber}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="weeded">Weeded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(v) => setFormData({ ...formData, condition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.publishYear}
                onChange={(e) =>
                  setFormData({ ...formData, publishYear: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₱)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.replacementCost}
                onChange={(e) =>
                  setFormData({ ...formData, replacementCost: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

