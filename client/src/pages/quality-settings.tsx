/**
 * Quality settings page.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';

export default function QualitySettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [minLength, setMinLength] = useState(10);
  const [maxLength, setMaxLength] = useState(10000);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);

  const handleSave = () => {
    // Save quality settings
    console.log({ minLength, maxLength, removeDuplicates, removeEmpty });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${id}/processing`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Quality Settings</h1>
          <p className="text-muted-foreground">
            Configure data quality filters for processing.
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Length Filters</CardTitle>
          <CardDescription>
            Filter records based on text content length.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Length (characters)</Label>
              <Input
                id="minLength"
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-sm text-muted-foreground">
                Records with content shorter than this will be filtered out.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLength">Maximum Length (characters)</Label>
              <Input
                id="maxLength"
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-sm text-muted-foreground">
                Records with content longer than this will be filtered out.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deduplication</CardTitle>
          <CardDescription>
            Remove duplicate or empty records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="removeDuplicates" className="font-medium">
                Remove Duplicate Records
              </Label>
              <p className="text-sm text-muted-foreground">
                Remove records that have identical content.
              </p>
            </div>
            <Switch
              id="removeDuplicates"
              checked={removeDuplicates}
              onCheckedChange={setRemoveDuplicates}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="removeEmpty" className="font-medium">
                Remove Empty Records
              </Label>
              <p className="text-sm text-muted-foreground">
                Remove records with empty or whitespace-only content.
              </p>
            </div>
            <Switch
              id="removeEmpty"
              checked={removeEmpty}
              onCheckedChange={setRemoveEmpty}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
