"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import {
  type BackendPagedResult,
  backendRequest,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, readProviderCache, writeProviderCache } from "@/lib/client/provider-cache";
import { initialDocuments, type IDocumentItem } from "@/providers/domainSeeds";
import { useAuthState } from "@/providers/authProvider";
import {
  type ICreateDocumentPayload,
  DocumentActionContext,
  DocumentStateContext,
} from "./context";

type BackendDocumentDto = {
  category?: number | string | null;
  categoryName?: string | null;
  contentType?: string | null;
  createdAt?: string | null;
  description?: string | null;
  fileName?: string | null;
  fileSize?: number | string | null;
  fileSizeBytes?: number | null;
  id: string;
  mimeType?: string | null;
  name?: string | null;
  relatedToId?: string | null;
  relatedToType?: number | string | null;
  sizeInBytes?: number | null;
  title?: string | null;
  uploadDate?: string | null;
  uploadedAt?: string | null;
};

const CLIENT_RELATED_TO_TYPE = 1;
const DEFAULT_DOCUMENT_CATEGORY = 1;

const formatFileSize = (sizeInBytes?: number | null) => {
  if (!sizeInBytes || sizeInBytes <= 0) {
    return "Unknown";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const inferDocumentType = (document: BackendDocumentDto) => {
  const namedType =
    typeof document.categoryName === "string" && document.categoryName.trim()
      ? document.categoryName.trim()
      : null;

  if (namedType) {
    return namedType;
  }

  const fileName = document.fileName ?? document.name ?? document.title ?? "";
  const extension = fileName.split(".").pop()?.trim().toUpperCase();

  if (extension) {
    return extension;
  }

  const mimeType = document.mimeType ?? document.contentType ?? "";

  if (mimeType) {
    return mimeType;
  }

  return "FILE";
};

const toDateOnly = (value?: string | null) => value?.split("T")[0] ?? "";

const mapBackendDocument = (
  document: BackendDocumentDto,
  fallbackClientId?: string,
): IDocumentItem => {
  const sizeInBytes =
    typeof document.fileSizeBytes === "number"
      ? document.fileSizeBytes
      : typeof document.sizeInBytes === "number"
        ? document.sizeInBytes
        : typeof document.fileSize === "number"
          ? document.fileSize
          : typeof document.fileSize === "string"
            ? Number(document.fileSize)
            : undefined;

  return {
    clientId: document.relatedToId ?? fallbackClientId,
    id: document.id,
    mimeType: document.mimeType ?? document.contentType ?? undefined,
    name:
      document.fileName ??
      document.name ??
      document.title ??
      document.description ??
      "Document",
    size: formatFileSize(sizeInBytes),
    sizeInBytes,
    type: inferDocumentType(document),
    uploadedDate:
      toDateOnly(document.uploadedAt) ||
      toDateOnly(document.uploadDate) ||
      toDateOnly(document.createdAt) ||
      new Date().toISOString().split("T")[0],
  };
};

const dedupeDocuments = (documents: IDocumentItem[]) => {
  const seenIds = new Set<string>();

  return documents.filter((document) => {
    if (seenIds.has(document.id)) {
      return false;
    }

    seenIds.add(document.id);
    return true;
  });
};

export const useDocumentState = () => {
  const context = useContext(DocumentStateContext);

  if (context === undefined) {
    throw new Error("useDocumentState must be used within DocumentProvider.");
  }

  return context;
};

export const useDocumentActions = () => {
  const context = useContext(DocumentActionContext);

  if (context === undefined) {
    throw new Error("useDocumentActions must be used within DocumentProvider.");
  }

  return context;
};

type DocumentProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export default function DocumentProvider({
  children,
}: DocumentProviderProps) {
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const scopedClientIds = useMemo(() => user?.clientIds ?? [], [user?.clientIds]);
  const isScopedClient = isClientScopedUser(user?.clientIds);
  const cacheKey = useMemo(
    () => createProviderCacheKey("documents", user?.tenantId, user?.userId),
    [user?.tenantId, user?.userId],
  );
  const cachedDocuments = useMemo(() => readProviderCache<IDocumentItem[]>(cacheKey), [cacheKey]);
  const [documents, setDocuments] = useState<IDocumentItem[]>(() => cachedDocuments ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const persistDocuments = useCallback(
    (items: IDocumentItem[]) => setDocuments(writeProviderCache(cacheKey, dedupeDocuments(items))),
    [cacheKey],
  );

  const fetchDocuments = useCallback(async () => {
    if (isDemoMode) {
      return isScopedClient
        ? initialDocuments().filter((item) => item.clientId && scopedClientIds.includes(item.clientId))
        : initialDocuments();
    }

    if (isScopedClient && scopedClientIds.length > 0) {
      const payloads = await Promise.all(
        scopedClientIds.map((clientId) =>
          backendRequest<BackendPagedResult<BackendDocumentDto> | BackendDocumentDto[]>(
            `/api/Documents?pageNumber=1&pageSize=100&relatedToType=${CLIENT_RELATED_TO_TYPE}&relatedToId=${encodeURIComponent(clientId)}`,
          ),
        ),
      );

      return dedupeDocuments(
        payloads.flatMap((payload, index) =>
          coerceItems(payload).map((document) => mapBackendDocument(document, scopedClientIds[index])),
        ),
      );
    }

    const payload = await backendRequest<BackendPagedResult<BackendDocumentDto> | BackendDocumentDto[]>(
      `/api/Documents?pageNumber=1&pageSize=100&relatedToType=${CLIENT_RELATED_TO_TYPE}`,
    );

    return dedupeDocuments(coerceItems(payload).map((document) => mapBackendDocument(document)));
  }, [isDemoMode, isScopedClient, scopedClientIds]);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);

    try {
      persistDocuments(await fetchDocuments());
    } finally {
      setIsLoading(false);
    }
  }, [fetchDocuments, persistDocuments]);

  useEffect(() => {
    writeProviderCache(cacheKey, documents);
  }, [cacheKey, documents]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleWorkspaceUpdate = () => {
      void loadDocuments().catch((error) => {
        console.error(error);
      });
    };

    window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);

    return () => {
      window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
    };
  }, [isAuthenticated, loadDocuments]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadDocuments().catch((error) => {
        console.error(error);

        if (isDemoMode) {
          persistDocuments(initialDocuments());
        }
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, isDemoMode, loadDocuments, persistDocuments]);

  const addDocument = useCallback(
    async ({ clientId, file }: ICreateDocumentPayload) => {
      if (isDemoMode) {
        const nextDocument: IDocumentItem = {
          clientId,
          id: `${Date.now()}`,
          mimeType: file.type || undefined,
          name: file.name,
          size: formatFileSize(file.size),
          sizeInBytes: file.size,
          type: inferDocumentType({ fileName: file.name, mimeType: file.type, id: `${Date.now()}` }),
          uploadedDate: new Date().toISOString().split("T")[0],
        };

        persistDocuments([...documents, nextDocument]);
        return nextDocument;
      }

      const formData = new FormData();

      formData.append("File", file);
      formData.append("Category", String(DEFAULT_DOCUMENT_CATEGORY));
      formData.append("RelatedToType", String(CLIENT_RELATED_TO_TYPE));
      formData.append("RelatedToId", clientId);
      formData.append("Description", file.name);

      await backendRequest<unknown>("/api/Documents/upload", {
        body: formData,
        method: "POST",
      });
      const refreshedDocuments = await fetchDocuments();
      const nextDocument =
        refreshedDocuments.find(
          (document) => document.clientId === clientId && document.name.toLowerCase() === file.name.toLowerCase(),
        ) ??
        {
          clientId,
          id: `${Date.now()}`,
          mimeType: file.type || undefined,
          name: file.name,
          size: formatFileSize(file.size),
          sizeInBytes: file.size,
          type: inferDocumentType({ fileName: file.name, mimeType: file.type, id: `${Date.now()}` }),
          uploadedDate: new Date().toISOString().split("T")[0],
        };

      persistDocuments(refreshedDocuments);
      window.dispatchEvent(new CustomEvent("mock-workspace-updated"));

      return nextDocument;
    },
    [documents, fetchDocuments, isDemoMode, persistDocuments],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!isDemoMode) {
        await backendRequest<void>(`/api/Documents/${id}`, {
          method: "DELETE",
        });
      }

      persistDocuments(documents.filter((item) => item.id !== id));
      window.dispatchEvent(new CustomEvent("mock-workspace-updated"));
    },
    [documents, isDemoMode, persistDocuments],
  );

  return (
    <DocumentStateContext.Provider value={{ documents: isAuthenticated ? documents : [], isLoading }}>
      <DocumentActionContext.Provider
        value={{
          addDocument,
          deleteDocument,
          refreshDocuments: loadDocuments,
        }}
      >
        {children}
      </DocumentActionContext.Provider>
    </DocumentStateContext.Provider>
  );
}
