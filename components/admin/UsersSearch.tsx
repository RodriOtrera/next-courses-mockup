"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SearchIcon } from "lucide-react";
import React, { useEffect } from "react";
import { UserDB } from "./CoursesUsersServer";
interface UsersSearchProps {
  users: UserDB[];
  handleUserSelect: (user: UserDB) => void;
  userSelect?: UserDB | null;
}

const UsersSearch: React.FC<UsersSearchProps> = ({
  users,
  handleUserSelect,
  userSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [valueSelected, setvalueSelected] = React.useState<string | null>(null);
  const [value, setValue] = React.useState<string>("");
  const [filteredUsers, setFilteredUsers] = React.useState<UserDB[]>([]);

  useEffect(() => {
    if (!value) {
      setFilteredUsers(users.slice(0, 50));
    } else {
      const filtered = users
        .filter((user) => user?.email?.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 50);
      setFilteredUsers(filtered);
    }
  }, [users, value]);

  useEffect(() => {
    if (userSelect) {
      setvalueSelected(userSelect.email);
      setValue(userSelect.email);
    }
  }, [userSelect]);

  return (
    <div className="">
      {" "}
      <p className="text-neutral-400 mb-2">Usuarios</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex justify-between w-full md:w-[400px]  text-ellipsis"
          >
            <p className=" text-start w-full overflow-hidden text-ellipsis">
              {valueSelected ? valueSelected : "Buscar usuario por email"}
            </p>
            <SearchIcon className="opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90vw] md:w-[350px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={value}
              onValueChange={setValue}
              placeholder="Buscar usuario por email"
            />

            <CommandList>
              <CommandEmpty>No encontrada.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    onSelect={(currentValue) => {
                      setValue(user?.email || '');
                      setOpen(false);
                      // handleSelect(description);
                      setvalueSelected(user?.email || '');
                      handleUserSelect(user);
                    }}
                    key={user.id}
                  >
                    <div className="flex">
                      <Avatar className="mr-3">
                        {user?.image && (
                          <AvatarImage src={user.image} alt="@shadcn" />
                        )}
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-semibold">{user?.email || 'No email'}</p>
                        <p className="text-xs text-gray-400">ID: {user?.id || 'N/A'}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default UsersSearch;