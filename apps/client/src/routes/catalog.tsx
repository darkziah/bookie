import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
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
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
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

const addBookSchema = z.object({
  accessionNumber: z.string(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string(),
  category: z.string(),
  publisher: z.string(),
  publishYear: z.string(),
  replacementCost: z.string(),
  location: z.string(),
  pages: z.string(),
  coverUrl: z.string(),
});

function AddBookDialog({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");

  const createBook = useMutation(api.books.create);
  const nextAccession = useQuery(api.books.getNextAccessionNumber, {});
  const generateUploadUrl = useMutation(api.books.generateUploadUrl);

  const form = useForm({
    defaultValues: {
      accessionNumber: "",
      title: "",
      author: "",
      isbn: "",
      category: "general",
      publisher: "",
      publishYear: "",
      replacementCost: "500",
      location: "",
      pages: "",
      coverUrl: "",
    },
    validators: {
      onChange: addBookSchema,
    },
    onSubmit: async ({ value }) => {
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
          accessionNumber: value.accessionNumber || nextAccession || "",
          title: value.title,
          author: value.author,
          isbn: value.isbn || undefined,
          category: value.category || "general",
          publisher: value.publisher || undefined,
          publicationYear: value.publishYear
            ? Number(value.publishYear)
            : undefined,
          replacementCost: value.replacementCost
            ? Number(value.replacementCost)
            : 500,
          location: value.location || "General",
          pages: value.pages ? Number(value.pages) : undefined,
          condition: "good",
        });
        toast.success("Book added successfully!");
        onClose();
      } catch (error: any) {
        toast.error("Failed to add book", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleCoverUpload = async (file: File) => {
    setCoverFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const currentIsbn = useStore(form.store, (state) => state.values.isbn);
  const currentCoverUrl = useStore(form.store, (state) => state.values.coverUrl);

  const handleIsbnLookup = async (isbnOverride?: string) => {
    const isbn = isbnOverride || currentIsbn;
    if (!isbn || isbn.length < 10) {
      toast.error("Please enter a valid ISBN (10 or 13 digits)");
      return;
    }

    setIsLookingUp(true);
    try {
      const { lookupIsbn, normalizeIsbn, isValidIsbn, mapSubjectsToCategory } = await import(
        "@/lib/isbn-lookup"
      );
      const normalized = normalizeIsbn(isbn);

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

      const category = mapSubjectsToCategory(metadata.subjects);

      form.setFieldValue("isbn", normalized);
      if (metadata.title) form.setFieldValue("title", metadata.title);
      if (metadata.author) form.setFieldValue("author", metadata.author);
      if (metadata.publisher) form.setFieldValue("publisher", metadata.publisher);
      if (metadata.publicationYear) form.setFieldValue("publishYear", metadata.publicationYear.toString());
      if (metadata.pages) form.setFieldValue("pages", metadata.pages.toString());
      if (metadata.coverUrl) form.setFieldValue("coverUrl", metadata.coverUrl);
      if (category) form.setFieldValue("category", category);

      toast.success("Book found!", {
        description: `"${metadata.title}" by ${metadata.author}${category ? ` (${category})` : ""}`,
      });
    } catch (error: any) {
      toast.error("Lookup failed", { description: error.message });
    } finally {
      setIsLookingUp(false);
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          {/* ISBN Lookup Section */}
          <div className="bg-muted/50 rounded-lg p-4 border space-y-3">
            <Label className="text-sm font-medium block">
              Quick ISBN Lookup
            </Label>
            <BarcodeScanner
              onScan={(code) => {
                form.setFieldValue("isbn", code);
                handleIsbnLookup(code);
              }}
              placeholder="Scan or enter ISBN..."
              scanButtonLabel="Scan ISBN"
              className="w-full"
            />
            {currentIsbn && !isLookingUp && (
              <div className="flex items-center justify-between px-3 py-2 bg-background/50 rounded-md border border-dashed">
                <div className="text-xs">
                  <span className="text-muted-foreground mr-2">Set ISBN:</span>
                  <span className="font-mono font-medium">{currentIsbn}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50/50"
                  onClick={() => form.setFieldValue("isbn", "")}
                >
                  Clear
                </Button>
              </div>
            )}
            {isLookingUp && (
              <div className="flex items-center justify-center py-2 gap-2 text-sm text-muted-foreground">
                <IconLoader2 className="h-4 w-4 animate-spin" />
                Looking up book details...
              </div>
            )}
            {(currentCoverUrl || coverPreview) && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={coverPreview || currentCoverUrl}
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
            <form.Field
              name="accessionNumber"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Accession Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder={nextAccession || "Auto-generated"}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        field.handleChange(nextAccession || "")
                      }
                    >
                      <IconBarcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            />
            <form.Field
              name="pages"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Pages</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    placeholder="e.g., 320"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>

          <form.Field
            name="title"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Title *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Book title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
                {field.state.meta.errors ? (
                  <em className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</em>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="author"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Author *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Author name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
                {field.state.meta.errors ? (
                  <em className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</em>
                ) : null}
              </div>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="category"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Category</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger id={field.name}>
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
              )}
            />
            <form.Field
              name="publisher"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Publisher</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Publisher name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <form.Field
              name="publishYear"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Year</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    placeholder="2024"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="replacementCost"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Cost (₱)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    placeholder="500"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="location"
              children={(field) => (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor={field.name}>Location</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Shelf A-3"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !canSubmit}
                className="w-full sm:w-auto"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Book"
                )}
              </Button>
            )}
          />
        </DialogFooter>
      </form>
    </DialogContent >
  );
}

const editBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string(),
  category: z.string(),
  publisher: z.string(),
  publishYear: z.string(),
  replacementCost: z.string(),
  location: z.string(),
  status: z.string(),
  condition: z.string(),
  pages: z.string(),
});

function EditBookDialog({ book, onClose }: { book: any; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const updateBook = useMutation(api.books.update);

  const form = useForm({
    defaultValues: {
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: book.category || "general",
      publisher: book.publisher || "",
      publishYear: book.publicationYear ? String(book.publicationYear) : "",
      replacementCost: book.replacementCost ? String(book.replacementCost) : "",
      location: book.location || "",
      status: book.status,
      condition: book.condition || "good",
      pages: book.pages ? String(book.pages) : "",
    },
    validators: {
      onChange: editBookSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true);
        await updateBook({
          id: book._id as Id<"books">,
          title: value.title,
          author: value.author,
          isbn: value.isbn || undefined,
          category: value.category || undefined,
          publisher: value.publisher || undefined,
          publicationYear: value.publishYear
            ? Number(value.publishYear)
            : undefined,
          replacementCost: value.replacementCost
            ? Number(value.replacementCost)
            : undefined,
          location: value.location || undefined,
          condition: value.condition as any,
          pages: value.pages ? Number(value.pages) : undefined,
        });
        toast.success("Book updated successfully!");
        onClose();
      } catch (error: any) {
        toast.error("Failed to update book", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>Edit Book</DialogTitle>
        <DialogDescription>Update details for {book.title}</DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
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
            <form.Field
              name="pages"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Pages</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    placeholder="e.g., 320"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>
          <form.Field
            name="isbn"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>ISBN</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />

          <form.Field
            name="title"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Title *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />

          <form.Field
            name="author"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Author *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="category"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Category</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger id={field.name}>
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
              )}
            />
            <form.Field
              name="publisher"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Publisher</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Publisher name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field
              name="status"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger id={field.name}>
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
              )}
            />
            <form.Field
              name="condition"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Condition</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger id={field.name}>
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
              )}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <form.Field
              name="publishYear"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Year</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="replacementCost"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Cost (₱)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="location"
              children={(field) => (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor={field.name}>Location</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !canSubmit}
                className="w-full sm:w-auto"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

