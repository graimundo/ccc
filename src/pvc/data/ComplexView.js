/**
 * Initializes a complex view instance.
 * 
 * @name pvc.data.ComplexView
 * 
 * @class Represents a view of certain dimensions over a given source complex instance.
 * @extends pvc.data.Complex
 * 
 * @property {pvc.data.Complex} source The source complex instance.
 * @property {string} label The composite label of the own atoms in the view.
 * @constructor
 * @param {pvc.data.Complex} source The source complex instance.
 * @param {string[]} viewDimNames The dimensions that should be revealed by the view.
 */
def.type('pvc.data.ComplexView', pvc.data.Complex)
.init(function(source, viewDimNames){

    this.source = source;
    
    this.viewDimNames = viewDimNames;
    
    /* Collect desired source atoms */
    var sourceAtoms = source.atoms,
        ownSourceAtoms = [];

    viewDimNames.forEach(function(dimName){
        if(def.hasOwnProp.call(sourceAtoms, dimName)){
            ownSourceAtoms.push(sourceAtoms[dimName]);
        }
    });

    // Call base constructor
    this.base(source, ownSourceAtoms, null, /* wantLabel */ true);
})
.add({
    values: function(){
        return pvc.data.Complex.values(this, this.viewDimNames);
    }
});