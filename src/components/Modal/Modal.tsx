import React, { PropsWithChildren, useEffect, useState } from 'react';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  header: string;
}

export const Modal: React.FC<ModalProps> = ({ open, header, children }) => {
  const [showModal, setShowModal] = useState(open);

  useEffect(() => {
    setShowModal(open);
  }, [open]);

  return (
    <>
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden outline-none focus:outline-none">
            <div className="relative mx-auto my-6 w-auto max-w-3xl">
              <div className="relative flex w-full flex-col rounded-lg border-0 bg-transparent shadow-lg outline-none focus:outline-none">
                <div className="relative flex-auto">{children}</div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-80"></div>
        </>
      )}
    </>
  );
};
