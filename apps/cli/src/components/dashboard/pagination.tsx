/**
 * Pagination component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';

export function Pagination(): React.ReactElement | null {
  const {
    filteredIssues,
    ui: { currentPage, itemsPerPage },
    setCurrentPage,
  } = useDashboardStore();

  const totalItems = filteredIssues.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const _goToFirstPage = () => goToPage(1);
  const _goToLastPage = () => goToPage(totalPages);
  const _goToPreviousPage = () => goToPage(currentPage - 1);
  const _goToNextPage = () => goToPage(currentPage + 1);

  // Create page numbers to show
  const getVisiblePages = () => {
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="space-between" alignItems="center">
        {/* Previous button */}
        <Box marginRight={2}>
          <Text color={currentPage > 1 ? 'cyan' : 'gray'} dimColor={currentPage === 1}>
            {currentPage > 1 ? '← Previous' : '← Previous'}
          </Text>
        </Box>

        {/* Page numbers */}
        <Box flexGrow={1} justifyContent="center">
          {visiblePages.map((page, _index) => {
            const isCurrentPage = page === currentPage;
            const showStartEllipsis = _index === 0 && page > 2;
            const showEndEllipsis = _index === visiblePages.length - 1 && page < totalPages - 1;

            return (
              <React.Fragment key={page}>
                {showStartEllipsis && (
                  <>
                    <Box marginRight={1}>
                      <Text color="gray">1</Text>
                    </Box>
                    <Box marginRight={1}>
                      <Text color="gray">...</Text>
                    </Box>
                  </>
                )}

                <Box marginRight={1}>
                  <Text
                    color={isCurrentPage ? 'white' : 'cyan'}
                    backgroundColor={isCurrentPage ? 'blue' : undefined}
                    underline={isCurrentPage}
                  >
                    {page}
                  </Text>
                </Box>

                {showEndEllipsis && (
                  <>
                    <Box marginRight={1}>
                      <Text color="gray">...</Text>
                    </Box>
                    <Box marginRight={1}>
                      <Text color="gray">{totalPages}</Text>
                    </Box>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </Box>

        {/* Next button */}
        <Box marginLeft={2}>
          <Text
            color={currentPage < totalPages ? 'cyan' : 'gray'}
            dimColor={currentPage === totalPages}
          >
            {currentPage < totalPages ? 'Next →' : 'Next →'}
          </Text>
        </Box>
      </Box>

      {/* Items information */}
      <Box justifyContent="center" marginTop={1}>
        <Text color="gray" dimColor>
          Showing {startIndex}-{endIndex} of {totalItems} issues
        </Text>
      </Box>
    </Box>
  );
}
