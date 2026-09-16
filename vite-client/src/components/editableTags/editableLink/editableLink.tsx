import { useState } from "react";
import type { ReactNode } from "react";

interface EditableLinkProps {
  name: string;
  href: string;
  editable?: boolean;
  className?: string;
  children?: ReactNode; // icon or anything else
  onChange?: (updated: { name: string; href: string }) => void;
}

const EditableLink = ({
  name,
  href,
  editable = false,
  className,
  children,
  onChange,
}: EditableLinkProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkName, setLinkName] = useState(name);
  const [linkHref, setLinkHref] = useState(href);

  const handleSave = () => {
    setIsModalOpen(false);
    onChange?.({ name: linkName, href: linkHref });
  };

  return (
    <>
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(e) => {
          if (editable) {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        {children}
        {linkName}
      </a>

      {isModalOpen && (
        <div style={modalStyles.backdrop}>
          <div style={modalStyles.modal}>
            <h3>Edit Link</h3>
            <label style={modalStyles.label}>
              Name:
              <input
                type="text"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </label>
            <label style={modalStyles.label}>
              Href:
              <input
                type="text"
                value={linkHref}
                onChange={(e) => setLinkHref(e.target.value)}
              />
            </label>
            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const modalStyles = {
  backdrop: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "300px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  label: {
    display: "block",
    marginBottom: "10px",
  },
};

export default EditableLink;