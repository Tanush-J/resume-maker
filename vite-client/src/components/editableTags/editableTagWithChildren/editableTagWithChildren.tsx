import { useRef } from "react";
import type { ReactNode, FormEvent } from "react";

type AllowedTextTags =
    "p"
  | "span"
  | "div"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "strong"
  | "em"
  | "i"
  | "b"
  | "li"
  | "ul"
  | "small"
  | "u"
  | "sub"
  | "sup"
  | "mark"
  | "blockquote";
type SafeHTMLElementTagNameMap = Pick<HTMLElementTagNameMap, AllowedTextTags>;

interface EditableTagWithChildrenProps {
  tag: keyof SafeHTMLElementTagNameMap;
  editable?: boolean;
  children: ReactNode;
  onChange?: (newText: string) => void;
  className?: string;
}

const EditableTagWithChildren = ({
  tag = "p",
  editable = true,
  children,
  onChange,
  className,
  ...rest
}: EditableTagWithChildrenProps & React.HTMLAttributes<HTMLElement>) => {
  const ref = useRef(null);
  const Tag = tag;

  const handleInput = (e: FormEvent<HTMLElement>) => {
    onChange?.(e.currentTarget.innerText);
  };

  return (
    <Tag
      ref={ref}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={handleInput}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default EditableTagWithChildren;