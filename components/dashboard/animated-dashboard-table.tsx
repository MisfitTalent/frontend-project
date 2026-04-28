"use client";

import { Empty, Skeleton, Table } from "antd";
import type { TableProps } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

type AnimatedDashboardTableProps<T extends object> = Pick<
  TableProps<T>,
  "columns" | "pagination" | "rowKey" | "scroll" | "size"
> & {
  className?: string;
  dataSource: T[];
  emptyDescription: string;
  isBusy?: boolean;
};

const ROW_HIGHLIGHT_DURATION_MS = 1800;
const INITIAL_EMPTY_DELAY_MS = 450;

const normalizeRowKey = <T extends object>(
  record: T,
  index: number,
  rowKey?: TableProps<T>["rowKey"],
) => {
  if (typeof rowKey === "function") {
    return String(rowKey(record));
  }

  if (typeof rowKey === "string") {
    const value = record[rowKey as keyof T];
    return String(value ?? index);
  }

  return String(index);
};

export function AnimatedDashboardTable<T extends object>({
  className,
  columns,
  dataSource,
  emptyDescription,
  isBusy = false,
  pagination = false,
  rowKey,
  scroll,
  size = "middle",
}: AnimatedDashboardTableProps<T>) {
  const [canShowEmpty, setCanShowEmpty] = useState(dataSource.length > 0);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const previousKeysRef = useRef<string[]>([]);

  useEffect(() => {
    if (dataSource.length > 0 || canShowEmpty) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCanShowEmpty(true);
    }, INITIAL_EMPTY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [canShowEmpty, dataSource.length]);

  const resolvedKeys = useMemo(
    () => dataSource.map((record, index) => normalizeRowKey(record, index, rowKey)),
    [dataSource, rowKey],
  );

  useEffect(() => {
    const previousKeys = new Set(previousKeysRef.current);
    const addedKeys =
      previousKeysRef.current.length === 0
        ? []
        : resolvedKeys.filter((key) => !previousKeys.has(key));

    previousKeysRef.current = resolvedKeys;

    if (addedKeys.length === 0) {
      return;
    }

    setHighlightedKeys((current) => [...new Set([...current, ...addedKeys])]);

    const timer = window.setTimeout(() => {
      setHighlightedKeys([]);
    }, ROW_HIGHLIGHT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [resolvedKeys]);

  const tableClassName = [
    "dashboard-responsive-table",
    "dashboard-animated-table",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const showSkeleton = dataSource.length === 0 && !canShowEmpty;

  return (
    <div
      className={`dashboard-table-shell ${isBusy ? "dashboard-table-shell--busy" : ""}`}
    >
      <Table<T>
        className={tableClassName}
        columns={columns}
        dataSource={dataSource}
        locale={{
          emptyText: showSkeleton ? (
            <div className="px-3 py-4">
              <Skeleton
                active
                paragraph={{ rows: 4 }}
                title={false}
              />
            </div>
          ) : (
            <Empty description={emptyDescription} />
          ),
        }}
        pagination={pagination}
        rowClassName={(record, index) =>
          highlightedKeys.includes(normalizeRowKey(record, index, rowKey))
            ? "dashboard-table-row--fresh"
            : ""
        }
        rowKey={rowKey}
        scroll={scroll}
        size={size}
      />
      <div className="dashboard-table-progress" />
    </div>
  );
}
