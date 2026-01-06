import { Button } from "@/components/ui/button";

interface MyButtonProps{
    text: string    
}

export function MyButton({text}: MyButtonProps) {
    
    return <Button variant="secondary">{text}</Button>;
}
