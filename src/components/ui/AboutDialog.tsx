import { Component } from "solid-js";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";

export const AboutDialog: Component<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About ArXivTok</DialogTitle>
          <DialogDescription>
            <p class="mb-4">
              ArXivTok is a TikTok-style interface for browsing arXiv papers. Swipe up and down to discover new research papers. Thank you to arXiv for use of its open access interoperability.
            </p>
            <div class="flex items-center space-x-2">
              <span>Forked from the original GitHub Repository:</span>
              <a
                href="https://github.com/miguel07alm/arxivtok"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-700 underline"
              >
                github.com/miguel07alm/arxivtok
              </a>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => props.onOpenChange(false)}
            class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
